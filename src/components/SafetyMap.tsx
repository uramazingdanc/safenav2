import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, Loader2, Info, Route, X, Check, Eye, EyeOff, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useActiveHazards } from '@/hooks/useHazards';
import { useRealtimeEvacuationCenters } from '@/hooks/useRealtimeEvacuationCenters';
import WeatherCard from '@/components/WeatherCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useGenerateRoute, type RouteDirection, type AlternativeRoute } from '@/hooks/useGenerateRoute';

// OpenLayers imports
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke, Text as OLText } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';

// Hazard types
const HAZARD_TYPES = ['flooding', 'landslide', 'road_damage', 'road_obstruction', 'other'];

const getHazardEmoji = (type: string): string => {
  const typeNormalized = type.toLowerCase();
  if (typeNormalized.includes('flood')) return '🌊';
  if (typeNormalized.includes('landslide')) return '⛰️';
  if (typeNormalized.includes('road') && typeNormalized.includes('damage')) return '🚧';
  if (typeNormalized.includes('road') && typeNormalized.includes('obstruction')) return '🚗';
  if (typeNormalized.includes('other')) return '⚠️';
  return '⚠️';
};

const getSeverityColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    low: '#eab308',
    medium: '#f97316',
    high: '#dc2626',
    critical: '#991b1b',
  };
  return colorMap[severity] || '#dc2626';
};

const getHazardStyle = (type: string, severity: string) => {
  const color = getSeverityColor(severity);
  const emoji = getHazardEmoji(type);
  
  return new Style({
    image: new Circle({
      radius: 18,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
    text: new OLText({
      text: emoji,
      font: '14px sans-serif',
      offsetY: 1,
      fill: new Fill({ color: '#ffffff' }),
    }),
  });
};

const userStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const evacStyle = new Style({
  image: new Circle({
    radius: 16,
    fill: new Fill({ color: '#16a34a' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: '🏠',
    font: '12px sans-serif',
    offsetY: 1,
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const primaryRouteStyle = new Style({
  stroke: new Stroke({
    color: '#3b82f6',
    width: 6,
  }),
});

const altRouteStyle = new Style({
  stroke: new Stroke({
    color: '#9ca3af',
    width: 4,
    lineDash: [12, 8],
  }),
});

const startPinStyle = new Style({
  image: new Circle({
    radius: 14,
    fill: new Fill({ color: '#22c55e' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: '▶',
    font: 'bold 12px sans-serif',
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const endPinStyle = new Style({
  image: new Circle({
    radius: 14,
    fill: new Fill({ color: '#ef4444' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: '◉',
    font: 'bold 14px sans-serif',
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const SafetyMap = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGenerated, setRouteGenerated] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [altRouteGeometry, setAltRouteGeometry] = useState<[number, number][] | null>(null);
  const [isSelectingRoute, setIsSelectingRoute] = useState(false);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const generateRouteMutation = useGenerateRoute();
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [showAltDirections, setShowAltDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    time: string;
    hasHazard: boolean;
    hazardCount: number;
    directions: RouteDirection[];
    summary?: string;
    hazardStatus?: string;
    alternativeRoute?: AlternativeRoute;
    safetyReminders?: string[];
  } | null>(null);
  const [popupContent, setPopupContent] = useState<{
    type: 'hazard' | 'evac' | 'user' | null;
    data: any;
    position: number[] | null;
  }>({ type: null, data: null, position: null });
  const [popupHost, setPopupHost] = useState<HTMLDivElement | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: hazards = [], isLoading: hazardsLoading } = useActiveHazards();
  const { data: allEvacCenters = [], isLoading: evacLoading } = useRealtimeEvacuationCenters();
  const evacCenters = allEvacCenters.filter(c => c.status !== 'full');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const userLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const altRouteLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const hazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const evacLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routePointsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const defaultCenter: [number, number] = [124.3989, 11.5669];

  useEffect(() => {
    if (!popupHost) return;
    popupHost.style.display = popupContent.type ? 'block' : 'none';
  }, [popupHost, popupContent.type]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const hazardSource = new VectorSource();
    const evacSource = new VectorSource();
    const userSource = new VectorSource();
    const routeSource = new VectorSource();
    const altRouteSource = new VectorSource();
    const routePointsSource = new VectorSource();

    const hazardLayer = new VectorLayer({ source: hazardSource, zIndex: 10 });
    const evacLayer = new VectorLayer({ source: evacSource, zIndex: 10 });
    const userLayer = new VectorLayer({ source: userSource, zIndex: 15 });
    const altRouteLayer = new VectorLayer({ source: altRouteSource, zIndex: 4 });
    const routeLayer = new VectorLayer({ source: routeSource, zIndex: 5 });
    const routePointsLayer = new VectorLayer({ source: routePointsSource, zIndex: 20 });

    userLayerRef.current = userLayer;
    routeLayerRef.current = routeLayer;
    altRouteLayerRef.current = altRouteLayer;
    hazardLayerRef.current = hazardLayer;
    evacLayerRef.current = evacLayer;
    routePointsLayerRef.current = routePointsLayer;

    const popupEl = document.createElement('div');
    popupEl.className = 'ol-popup bg-background rounded-lg shadow-lg border';
    popupEl.style.position = 'absolute';
    popupEl.style.minWidth = '120px';
    popupEl.style.display = 'none';
    setPopupHost(popupEl);

    const overlay = new Overlay({
      element: popupEl,
      autoPan: true,
    });
    overlayRef.current = overlay;

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        altRouteLayer,
        routeLayer,
        hazardLayer,
        evacLayer,
        userLayer,
        routePointsLayer,
      ],
      view: new View({
        center: fromLonLat(defaultCenter),
        zoom: 13,
      }),
      overlays: [overlay],
    });

    mapInstanceRef.current = map;

    return () => {
      overlay.setPosition(undefined);
      popupEl.remove();
      overlayRef.current = null;
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (evt: any) => {
      if (selectionMode) {
        const coordinate = toLonLat(evt.coordinate);
        const coords = { lat: coordinate[1], lng: coordinate[0] };
        
        if (selectionMode === 'start') {
          setStartCoords(coords);
          toast({ title: '✅ Start Point Set', description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}` });
        } else {
          setEndCoords(coords);
          toast({ title: '✅ Destination Set', description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}` });
        }
        setSelectionMode(null);
        return;
      }

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const coordinates = (feature.getGeometry() as Point).getCoordinates();
        const featureType = feature.get('featureType');
        
        if (featureType === 'hazard') {
          setPopupContent({
            type: 'hazard',
            data: {
              type: feature.get('type'),
              severity: feature.get('severity'),
              location: feature.get('location'),
              photo_url: feature.get('photo_url'),
            },
            position: coordinates,
          });
        } else if (featureType === 'evac') {
          setPopupContent({
            type: 'evac',
            data: {
              name: feature.get('name'),
              status: feature.get('status'),
              location: feature.get('location'),
              capacity: feature.get('capacity'),
              current_occupancy: feature.get('current_occupancy'),
            },
            position: coordinates,
          });
        } else if (featureType === 'user') {
          setPopupContent({ type: 'user', data: {}, position: coordinates });
        }
        
        overlayRef.current?.setPosition(coordinates);
      } else if (!selectionMode) {
        setPopupContent({ type: null, data: null, position: null });
        overlayRef.current?.setPosition(undefined);
      }
    };

    map.on('click', handleClick);

    const handlePointerMove = (evt: any) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = selectionMode ? 'crosshair' : (hit ? 'pointer' : '');
    };

    map.on('pointermove', handlePointerMove);

    return () => {
      map.un('click', handleClick);
      map.un('pointermove', handlePointerMove);
    };
  }, [selectionMode, toast]);

  // Update hazard markers
  useEffect(() => {
    if (!hazardLayerRef.current) return;
    const source = hazardLayerRef.current.getSource();
    if (!source) return;
    source.clear();

    hazards.forEach((hazard) => {
      if (hazard.latitude && hazard.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([hazard.longitude, hazard.latitude])),
          name: hazard.type,
          type: hazard.type,
          severity: hazard.severity,
          location: hazard.location,
          photo_url: hazard.photo_url,
          featureType: 'hazard',
        });
        feature.setStyle(getHazardStyle(hazard.type, hazard.severity));
        source.addFeature(feature);
      }
    });
  }, [hazards]);

  // Update evac markers
  useEffect(() => {
    if (!evacLayerRef.current) return;
    const source = evacLayerRef.current.getSource();
    if (!source) return;
    source.clear();

    evacCenters.forEach((center) => {
      if (center.latitude && center.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([center.longitude, center.latitude])),
          name: center.name,
          status: center.status,
          location: center.location,
          capacity: center.capacity,
          current_occupancy: center.current_occupancy,
          featureType: 'evac',
        });
        feature.setStyle(evacStyle);
        source.addFeature(feature);
      }
    });
  }, [evacCenters]);

  // Update user location marker
  useEffect(() => {
    if (!userLayerRef.current || !mapInstanceRef.current) return;
    const source = userLayerRef.current.getSource();
    if (!source) return;
    source.clear();

    if (userLocation) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([userLocation[1], userLocation[0]])),
        name: 'Your Location',
        featureType: 'user',
      });
      feature.setStyle(userStyle);
      source.addFeature(feature);

      mapInstanceRef.current.getView().animate({
        center: fromLonLat([userLocation[1], userLocation[0]]),
        zoom: 14,
        duration: 500,
      });
    }
  }, [userLocation]);

  // Update route points, primary line, and alt line
  useEffect(() => {
    if (!routePointsLayerRef.current || !routeLayerRef.current || !altRouteLayerRef.current) return;

    const pointsSource = routePointsLayerRef.current.getSource();
    const routeSource = routeLayerRef.current.getSource();
    const altSource = altRouteLayerRef.current.getSource();
    if (!pointsSource || !routeSource || !altSource) return;

    pointsSource.clear();
    routeSource.clear();
    altSource.clear();

    if (startCoords) {
      const startFeature = new Feature({ geometry: new Point(fromLonLat([startCoords.lng, startCoords.lat])) });
      startFeature.setStyle(startPinStyle);
      pointsSource.addFeature(startFeature);
    }

    if (endCoords) {
      const endFeature = new Feature({ geometry: new Point(fromLonLat([endCoords.lng, endCoords.lat])) });
      endFeature.setStyle(endPinStyle);
      pointsSource.addFeature(endFeature);
    }

    if (startCoords && endCoords && routeGenerated) {
      // Draw alt route first (behind primary)
      if (altRouteGeometry && altRouteGeometry.length > 0) {
        const altCoords = altRouteGeometry.map(coord => fromLonLat(coord));
        const altFeature = new Feature({ geometry: new LineString(altCoords) });
        altFeature.setStyle(altRouteStyle);
        altSource.addFeature(altFeature);
      }

      // Draw primary route
      let routeCoords: number[][];
      if (routeGeometry && routeGeometry.length > 0) {
        routeCoords = routeGeometry.map(coord => fromLonLat(coord));
      } else {
        routeCoords = [
          fromLonLat([startCoords.lng, startCoords.lat]),
          fromLonLat([endCoords.lng, endCoords.lat]),
        ];
      }

      const routeFeature = new Feature({ geometry: new LineString(routeCoords) });
      routeFeature.setStyle(primaryRouteStyle);
      routeSource.addFeature(routeFeature);

      const extent = routeSource.getExtent();
      mapInstanceRef.current?.getView().fit(extent, {
        padding: [60, 60, 60, 60],
        maxZoom: 16,
        duration: 500,
      });
    }
  }, [startCoords, endCoords, routeGenerated, routeGeometry, altRouteGeometry]);

  const handleStartSelection = useCallback((mode: 'start' | 'end') => {
    setSelectionMode(mode);
    setIsSelectingRoute(true);
    overlayRef.current?.setPosition(undefined);
    toast({
      title: mode === 'start' ? '📍 Select Start Point' : '🎯 Select Destination',
      description: 'Tap anywhere on the map to set the location',
    });
  }, [toast]);

  const handleGenerateRoute = useCallback(async () => {
    if (!startCoords || !endCoords) {
      toast({ title: 'Missing Points', description: 'Please set both start and destination points', variant: 'destructive' });
      return;
    }

    setIsGeneratingRoute(true);

    const distance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const motorcycleSpeed = 40; // km/h
    const timeMinutes = Math.round((distance / motorcycleSpeed) * 60);

    const routeBuffer = 0.02;
    const hazardsOnRoute = hazards.filter((hazard) => {
      if (!hazard.latitude || !hazard.longitude) return false;
      const minLat = Math.min(startCoords.lat, endCoords.lat) - routeBuffer;
      const maxLat = Math.max(startCoords.lat, endCoords.lat) + routeBuffer;
      const minLng = Math.min(startCoords.lng, endCoords.lng) - routeBuffer;
      const maxLng = Math.max(startCoords.lng, endCoords.lng) + routeBuffer;
      return hazard.latitude >= minLat && hazard.latitude <= maxLat && hazard.longitude >= minLng && hazard.longitude <= maxLng;
    });

    try {
      const aiResponse = await generateRouteMutation.mutateAsync({
        startCoords,
        endCoords,
        hazards: hazardsOnRoute.map(h => ({
          type: h.type,
          severity: h.severity,
          lat: h.latitude!,
          lng: h.longitude!,
          description: h.description || undefined,
        })),
        totalDistance: distance,
        walkingTime: timeMinutes,
      });

      const formattedDirections = aiResponse.directions.map(dir => ({
        ...dir,
        distance: dir.distance.startsWith('(') ? dir.distance : `(${dir.distance})`,
      }));

      setRouteGeometry(aiResponse.routeGeometry || null);
      setAltRouteGeometry(aiResponse.alternativeRoute?.routeGeometry || null);

      const distKm = aiResponse.distance ? (aiResponse.distance / 1000).toFixed(2) + ' km' : (distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`);
      const durMin = aiResponse.duration ? Math.round(aiResponse.duration / 60) + ' min' : `${timeMinutes} min`;

      setRouteInfo({
        distance: distKm,
        time: durMin,
        hasHazard: aiResponse.hazardStatus !== 'ROUTE_CLEAR',
        hazardCount: aiResponse.hazardCount || hazardsOnRoute.length,
        directions: formattedDirections,
        summary: aiResponse.summary,
        hazardStatus: aiResponse.hazardStatus,
        alternativeRoute: aiResponse.alternativeRoute,
        safetyReminders: aiResponse.safetyReminders,
      });

      setRouteGenerated(true);

      if (aiResponse.hazardStatus === 'ROUTE_CLEAR') {
        toast({ title: '✅ Safe Route Generated', description: 'Route is clear of reported hazards.' });
      } else if (aiResponse.hazardStatus === 'ALTERNATIVE_ROUTE_USED') {
        toast({ title: '🔀 Alternative Route Available', description: 'A safer route was selected. Alternative shown as dashed line.' });
      } else {
        toast({ title: '⚠️ Hazard Warning', description: 'No hazard-free route available. Proceed with caution.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Route generation failed, using fallback:', error);
      
      setRouteGeometry(null);
      setAltRouteGeometry(null);

      setRouteInfo({
        distance: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`,
        time: timeMinutes < 60 ? `${timeMinutes} min` : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`,
        hasHazard: hazardsOnRoute.length > 0,
        hazardCount: hazardsOnRoute.length,
        directions: [],
        hazardStatus: hazardsOnRoute.length > 0 ? 'HAZARDS_PRESENT_NO_ALTERNATIVE' : 'ROUTE_CLEAR',
      });

      setRouteGenerated(true);
      toast({ title: '📍 Route Generated', description: 'Using estimated route. Road data temporarily unavailable.' });
    } finally {
      setIsGeneratingRoute(false);
    }
  }, [startCoords, endCoords, hazards, toast, generateRouteMutation]);

  const handleClearRoute = useCallback(() => {
    setStartCoords(null);
    setEndCoords(null);
    setRouteGenerated(false);
    setRouteInfo(null);
    setRouteGeometry(null);
    setAltRouteGeometry(null);
    setIsSelectingRoute(false);
    setSelectionMode(null);
    setShowDirectionsPanel(false);
    setShowAltDirections(false);
  }, []);

  const isLoading = hazardsLoading || evacLoading;
  const canGenerateRoute = startCoords && endCoords && !routeGenerated;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ROUTE_CLEAR':
        return { label: 'ROUTE CLEAR', className: 'bg-green-500 text-white' };
      case 'ALTERNATIVE_ROUTE_USED':
        return { label: 'ALT. ROUTE USED', className: 'bg-blue-500 text-white' };
      case 'HAZARDS_PRESENT_NO_ALTERNATIVE':
        return { label: 'HAZARDS PRESENT', className: 'bg-amber-400 text-amber-900' };
      default:
        return { label: 'ROUTE CLEAR', className: 'bg-green-500 text-white' };
    }
  };

  const activeDirections = showAltDirections && routeInfo?.alternativeRoute
    ? routeInfo.alternativeRoute.directions
    : routeInfo?.directions || [];

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t.hazardMap}
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            ☁️ {t.weather}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="mt-4">
          <WeatherCard />
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          {/* Route Planning Controls */}
          <div className="flex gap-2 py-3">
            <Button 
              variant={selectionMode === 'start' ? 'default' : 'outline'} 
              size="sm" 
              className="flex-1"
              onClick={() => handleStartSelection('start')}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {startCoords ? t.startSet : t.pinStart}
            </Button>
            <Button 
              variant={selectionMode === 'end' ? 'default' : 'outline'} 
              size="sm" 
              className="flex-1"
              onClick={() => handleStartSelection('end')}
            >
              <Navigation className="w-4 h-4 mr-1" />
              {endCoords ? t.endSet : t.pinEnd}
            </Button>
          </div>

          {/* Selection Mode Indicator */}
          {selectionMode && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${selectionMode === 'start' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {selectionMode === 'start' ? t.tapToSetStart : t.tapToSetEnd}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectionMode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Route Actions */}
          {(startCoords || endCoords) && (
            <div className="flex gap-2 mb-3">
              <Button 
                className="flex-1" 
                disabled={!canGenerateRoute || isGeneratingRoute}
                onClick={handleGenerateRoute}
              >
                {isGeneratingRoute ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Route className="w-4 h-4 mr-2" />
                )}
                {isGeneratingRoute ? 'Generating...' : routeGenerated ? 'Route Generated' : '🏍️ Generate Route'}
              </Button>
              <Button variant="outline" onClick={handleClearRoute}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Container */}
      <div className="flex-1 mx-4 mb-2 rounded-xl overflow-hidden shadow-lg border min-h-[300px] relative">
        <div ref={mapRef} className="w-full h-full min-h-[300px]" />
        
        {/* Toggle Legend Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 shadow-lg z-10"
          onClick={() => setShowLegend(!showLegend)}
        >
          {showLegend ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showLegend ? 'Hide' : 'Show'} Legend
        </Button>

        {/* Floating Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border p-3 max-w-[200px] z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-1">
                <Info className="w-4 h-4" />
                Legend
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowLegend(false)}>×</Button>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-medium text-muted-foreground">Hazard Types:</p>
              <div className="flex items-center gap-2"><span className="text-base">🌊</span><span>Flood</span></div>
              <div className="flex items-center gap-2"><span className="text-base">⛰️</span><span>Landslide</span></div>
              <div className="flex items-center gap-2"><span className="text-base">🚧</span><span>Road Damage</span></div>
              <div className="flex items-center gap-2"><span className="text-base">🚗</span><span>Road Obstruction</span></div>
              <div className="flex items-center gap-2"><span className="text-base">⚠️</span><span>Other</span></div>
              <div className="flex items-center gap-2"><span className="text-base">🏠</span><span>Evac Center ({evacCenters.length})</span></div>
              <div className="border-t border-muted my-2" />
              <p className="font-medium text-muted-foreground">Severity:</p>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" /><span>Low</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow" /><span>Medium</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow" /><span>High</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-800 border-2 border-white shadow" /><span>Critical</span></div>
              {routeGenerated && (
                <>
                  <div className="border-t border-muted my-2" />
                  <p className="font-medium text-muted-foreground">Routes:</p>
                  <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-blue-500" /><span>Primary (Safest)</span></div>
                  {altRouteGeometry && (
                    <div className="flex items-center gap-2"><div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" /><span>Alternative</span></div>
                  )}
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Start</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Destination</span></div>
                </>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center gap-1 text-muted-foreground mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Popup UI */}
        {popupHost &&
          createPortal(
            <div className="text-center p-2">
              {popupContent.type === 'hazard' && popupContent.data ? (
                <>
                  <span className="text-2xl">{getHazardEmoji(popupContent.data.type)}</span>
                  <br />
                  <strong
                    className={
                      popupContent.data.severity === 'low' ? 'text-yellow-500'
                        : popupContent.data.severity === 'medium' ? 'text-orange-500'
                        : popupContent.data.severity === 'high' ? 'text-red-500'
                        : 'text-red-700'
                    }
                  >
                    {popupContent.data.type}
                  </strong>
                  <p className={`text-xs capitalize font-semibold ${
                    popupContent.data.severity === 'low' ? 'text-yellow-500'
                      : popupContent.data.severity === 'medium' ? 'text-orange-500'
                      : popupContent.data.severity === 'high' ? 'text-red-500'
                      : 'text-red-700'
                  }`}>
                    Severity: {popupContent.data.severity}
                  </p>
                  <p className="text-xs">{popupContent.data.location}</p>
                  {popupContent.data.photo_url && (
                    <img src={popupContent.data.photo_url} alt="Hazard photo" className="w-full h-20 object-cover rounded mt-2 border" />
                  )}
                </>
              ) : popupContent.type === 'evac' && popupContent.data ? (
                (() => {
                  const cap = popupContent.data.capacity || 0;
                  const occ = popupContent.data.current_occupancy || 0;
                  const pct = cap > 0 ? Math.min((occ / cap) * 100, 100) : 0;
                  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
                  return (
                    <div style={{ textAlign: 'center', minWidth: '160px' }}>
                      <span style={{ fontSize: '1.5rem' }}>🏠</span><br />
                      <strong style={{ color: '#16a34a' }}>{popupContent.data.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{popupContent.data.location}</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '4px' }}>Occupancy: {occ} / {cap}</p>
                      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden', marginTop: '4px', marginLeft: 'auto', marginRight: 'auto', maxWidth: '80%' }}>
                        <div style={{ height: '100%', borderRadius: '9999px', width: `${pct}%`, backgroundColor: barColor, transition: 'all 0.3s' }} />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Status: {popupContent.data.status?.charAt(0).toUpperCase() + popupContent.data.status?.slice(1)}</p>
                    </div>
                  );
                })()
              ) : popupContent.type === 'user' ? (
                <><span className="text-xl">📍</span><br /><strong>Your Location</strong></>
              ) : null}
            </div>,
            popupHost
          )}

        {/* Route Info Overlay */}
        {routeGenerated && routeInfo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border z-10 min-w-[280px] max-w-[340px]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-lg font-bold text-primary">{routeInfo.distance}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Time (🏍️)</p>
                  <p className="text-lg font-bold text-primary">{routeInfo.time}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(routeInfo.hazardStatus).className}`}>
                {getStatusBadge(routeInfo.hazardStatus).label}
              </div>
            </div>
            {routeInfo.summary && (
              <p className={`text-xs p-2 rounded mb-1 ${
                routeInfo.hazardStatus === 'ROUTE_CLEAR' ? 'bg-green-50 text-green-800 border border-green-200'
                  : routeInfo.hazardStatus === 'ALTERNATIVE_ROUTE_USED' ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {routeInfo.summary}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs mt-1"
              onClick={() => setShowDirectionsPanel(!showDirectionsPanel)}
            >
              {showDirectionsPanel ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {showDirectionsPanel ? 'Hide Details' : 'View Directions & Details'}
            </Button>
          </div>
        )}
      </div>

      {/* Expandable Directions Panel */}
      {routeGenerated && routeInfo && showDirectionsPanel && (
        <div className="mx-4 mb-2 max-h-[40vh] overflow-y-auto">
          <Card className="border-2">
            <CardContent className="p-3">
              {/* Alt Route Toggle */}
              {routeInfo.alternativeRoute && (
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={!showAltDirections ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setShowAltDirections(false)}
                  >
                    Primary Route
                  </Button>
                  <Button
                    variant={showAltDirections ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setShowAltDirections(true)}
                  >
                    Alternative Route
                  </Button>
                </div>
              )}

              {showAltDirections && routeInfo.alternativeRoute && (
                <div className="p-2 bg-muted/50 rounded-lg mb-3 text-xs text-muted-foreground">
                  {routeInfo.alternativeRoute.summary}
                </div>
              )}

              {/* Turn-by-turn */}
              <div className="space-y-1 mb-3 text-xs">
                {activeDirections.map((dir, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-muted-foreground w-14 flex-shrink-0">
                      {dir.distance.startsWith('(') ? dir.distance : `(${dir.distance})`}
                    </span>
                    <span className={dir.hasHazard ? 'text-amber-600 font-medium' : 'text-foreground'}>
                      {dir.instruction}
                      {dir.hasHazard && (
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                          ⚠️ {dir.hazardType}
                        </span>
                      )}
                    </span>
                  </div>
                ))}

                {activeDirections.length === 0 && (
                  <p className="text-muted-foreground italic">Detailed directions unavailable. Follow the route on the map.</p>
                )}
              </div>

              {/* Hazard warnings */}
              {routeInfo.hasHazard && routeInfo.directions.some(d => d.hazardWarning) && (
                <div className="space-y-1 mb-3">
                  {routeInfo.directions.filter(d => d.hazardWarning).map((dir, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{dir.hazardWarning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Safety Reminders */}
              {routeInfo.safetyReminders && routeInfo.safetyReminders.length > 0 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-3 h-3 text-red-600" />
                    <p className="text-xs font-semibold text-red-800">Safety Reminders</p>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {routeInfo.safetyReminders.map((reminder, idx) => (
                      <li key={idx} className="text-xs text-red-700">{reminder}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Hazards Summary */}
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground text-center">
          Naval, Biliran - {hazards.length} hazard{hazards.length !== 1 ? 's' : ''} • {evacCenters.length} evacuation center{evacCenters.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Floating Report Button */}
      <Button
        className="fixed bottom-24 right-4 md:bottom-8 rounded-full w-14 h-14 shadow-xl z-50 bg-destructive hover:bg-destructive/90"
        onClick={() => navigate('/report')}
      >
        <AlertTriangle className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default SafetyMap;
