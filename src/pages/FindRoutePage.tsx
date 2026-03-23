import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ArrowLeft, Route, Clock, Ruler, AlertTriangle, Loader2, Crosshair, Building2, Keyboard, Sparkles, ShieldAlert, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveHazards } from '@/hooks/useHazards';
import { useOpenEvacuationCenters } from '@/hooks/useEvacuationCenters';
import MapPickerModal from '@/components/MapPickerModal';
import { useGenerateRoute, type RouteDirection, type AlternativeRoute } from '@/hooks/useGenerateRoute';

// OpenLayers imports
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke, Text as OLText } from 'ol/style';
import 'ol/ol.css';

// Marker styles
const startPinStyle = new Style({
  image: new Circle({
    radius: 12,
    fill: new Fill({ color: '#22c55e' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: 'S',
    font: 'bold 10px sans-serif',
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const endPinStyle = new Style({
  image: new Circle({
    radius: 12,
    fill: new Fill({ color: '#ef4444' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: 'E',
    font: 'bold 10px sans-serif',
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

const getHazardEmoji = (type: string): string => {
  const typeNormalized = type.toLowerCase();
  if (typeNormalized.includes('flood')) return '🌊';
  if (typeNormalized.includes('landslide')) return '⛰️';
  if (typeNormalized.includes('road') && typeNormalized.includes('damage')) return '🚧';
  if (typeNormalized.includes('road') && typeNormalized.includes('obstruction')) return '🚗';
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
      radius: 14,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
    text: new OLText({
      text: emoji,
      font: '12px sans-serif',
      fill: new Fill({ color: '#ffffff' }),
    }),
  });
};

const FindRoutePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: hazards = [] } = useActiveHazards();
  const { data: evacCenters = [] } = useOpenEvacuationCenters();

  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [routeGenerated, setRouteGenerated] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [altRouteGeometry, setAltRouteGeometry] = useState<[number, number][] | null>(null);
  const [showAltDirections, setShowAltDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ 
    distance: string; 
    time: string; 
    hasHazard: boolean; 
    hazardCount: number;
    directions: RouteDirection[];
    nearbyEvacCount: number;
    summary?: string;
    hazardStatus?: string;
    alternativeRoute?: AlternativeRoute;
    safetyReminders?: string[];
  } | null>(null);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  
  const generateRouteMutation = useGenerateRoute();
  const [mapReady, setMapReady] = useState(false);
  
  const [startInputMode, setStartInputMode] = useState<'map' | 'coords'>('map');
  const [endInputMode, setEndInputMode] = useState<'map' | 'coords' | 'evac'>('map');
  
  const [startLatInput, setStartLatInput] = useState('');
  const [startLngInput, setStartLngInput] = useState('');
  const [endLatInput, setEndLatInput] = useState('');
  const [endLngInput, setEndLngInput] = useState('');
  
  const [selectedEvac, setSelectedEvac] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const altRouteLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const hazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const defaultCenter = { lat: 11.5601, lng: 124.3949 };

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

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Geolocation is not supported by your browser.', variant: 'destructive' });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setStartCoords(coords);
        setStartLatInput(coords.lat.toFixed(6));
        setStartLngInput(coords.lng.toFixed(6));
        setIsGettingLocation(false);
        toast({ title: '📍 Location Found', description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}` });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({ title: 'Location Error', description: error.message || 'Failed to get your location.', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSetStartCoords = () => {
    const lat = parseFloat(startLatInput);
    const lng = parseFloat(startLngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setStartCoords({ lat, lng });
      toast({ title: '✅ Start Point Set' });
    } else {
      toast({ title: 'Invalid Coordinates', variant: 'destructive' });
    }
  };

  const handleSetEndCoords = () => {
    const lat = parseFloat(endLatInput);
    const lng = parseFloat(endLngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setEndCoords({ lat, lng });
      toast({ title: '✅ Destination Set' });
    } else {
      toast({ title: 'Invalid Coordinates', variant: 'destructive' });
    }
  };

  const handleSelectEvac = (evacId: string) => {
    setSelectedEvac(evacId);
    const center = evacCenters.find(c => c.id === evacId);
    if (center && center.latitude && center.longitude) {
      setEndCoords({ lat: center.latitude, lng: center.longitude });
      toast({ title: '🏠 Evacuation Center Selected', description: center.name });
    }
  };

  // Initialize result map
  useEffect(() => {
    if (!routeGenerated || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const markersSource = new VectorSource();
      const routeSource = new VectorSource();
      const altRouteSource = new VectorSource();
      const hazardSource = new VectorSource();

      const markersLayer = new VectorLayer({ source: markersSource, zIndex: 20 });
      const altRouteLayer = new VectorLayer({ source: altRouteSource, zIndex: 4 });
      const routeLayer = new VectorLayer({ source: routeSource, zIndex: 5 });
      const hazardLayer = new VectorLayer({ source: hazardSource, zIndex: 10 });

      markersLayerRef.current = markersLayer;
      routeLayerRef.current = routeLayer;
      altRouteLayerRef.current = altRouteLayer;
      hazardLayerRef.current = hazardLayer;

      const map = new OLMap({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          altRouteLayer,
          routeLayer,
          hazardLayer,
          markersLayer,
        ],
        view: new View({
          center: fromLonLat([defaultCenter.lng, defaultCenter.lat]),
          zoom: 14,
        }),
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, [routeGenerated]);

  // Draw route and markers when map is ready
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !startCoords || !endCoords) return;

    const markersSource = markersLayerRef.current?.getSource();
    const routeSource = routeLayerRef.current?.getSource();
    const altRouteSource = altRouteLayerRef.current?.getSource();
    const hazardSource = hazardLayerRef.current?.getSource();

    if (!markersSource || !routeSource || !hazardSource) return;

    markersSource.clear();
    routeSource.clear();
    altRouteSource?.clear();
    hazardSource.clear();

    // Start marker
    const startFeature = new Feature({ geometry: new Point(fromLonLat([startCoords.lng, startCoords.lat])) });
    startFeature.setStyle(startPinStyle);
    markersSource.addFeature(startFeature);

    // End marker
    const endFeature = new Feature({ geometry: new Point(fromLonLat([endCoords.lng, endCoords.lat])) });
    endFeature.setStyle(endPinStyle);
    markersSource.addFeature(endFeature);

    // Draw alternative route first (dashed, behind primary)
    if (altRouteGeometry && altRouteGeometry.length > 0 && altRouteSource) {
      const altCoords = altRouteGeometry.map(coord => fromLonLat(coord));
      const altFeature = new Feature({ geometry: new LineString(altCoords) });
      altFeature.setStyle(altRouteStyle);
      altRouteSource.addFeature(altFeature);
    }

    // Draw primary route (solid)
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

    // Hazard markers near route
    const routeBuffer = 0.02;
    const nearbyHazards = hazards.filter(h => {
      if (!h.latitude || !h.longitude) return false;
      const minLat = Math.min(startCoords.lat, endCoords.lat) - routeBuffer;
      const maxLat = Math.max(startCoords.lat, endCoords.lat) + routeBuffer;
      const minLng = Math.min(startCoords.lng, endCoords.lng) - routeBuffer;
      const maxLng = Math.max(startCoords.lng, endCoords.lng) + routeBuffer;
      return h.latitude >= minLat && h.latitude <= maxLat && h.longitude >= minLng && h.longitude <= maxLng;
    });

    nearbyHazards.forEach(hazard => {
      if (hazard.latitude && hazard.longitude) {
        const feature = new Feature({ geometry: new Point(fromLonLat([hazard.longitude, hazard.latitude])) });
        feature.setStyle(getHazardStyle(hazard.type, hazard.severity));
        hazardSource.addFeature(feature);
      }
    });

    // Fit view
    const extent = routeSource.getExtent();
    mapInstanceRef.current?.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 16, duration: 500 });

  }, [mapReady, startCoords, endCoords, hazards, routeGeometry, altRouteGeometry]);

  const openPicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setIsPickerOpen(true);
  };

  const handlePickerConfirm = (coords: { lat: number; lng: number }) => {
    if (pickerMode === 'start') {
      setStartCoords(coords);
      setStartLatInput(coords.lat.toFixed(6));
      setStartLngInput(coords.lng.toFixed(6));
    } else {
      setEndCoords(coords);
      setEndLatInput(coords.lat.toFixed(6));
      setEndLngInput(coords.lng.toFixed(6));
    }
  };

  const handleGenerateRoute = async () => {
    if (!startCoords || !endCoords) return;
    
    setIsGeneratingRoute(true);
    
    const totalDistance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const motorcycleSpeed = 40; // km/h
    const timeMinutes = Math.round((totalDistance / motorcycleSpeed) * 60);

    const routeBuffer = 0.02;
    const hazardsOnRoute = hazards.filter(h => {
      if (!h.latitude || !h.longitude) return false;
      const minLat = Math.min(startCoords.lat, endCoords.lat) - routeBuffer;
      const maxLat = Math.max(startCoords.lat, endCoords.lat) + routeBuffer;
      const minLng = Math.min(startCoords.lng, endCoords.lng) - routeBuffer;
      const maxLng = Math.max(startCoords.lng, endCoords.lng) + routeBuffer;
      return h.latitude >= minLat && h.latitude <= maxLat && h.longitude >= minLng && h.longitude <= maxLng;
    });

    const nearbyEvacCenters = evacCenters.filter(e => {
      if (!e.latitude || !e.longitude) return false;
      const dist = calculateDistance(
        (startCoords.lat + endCoords.lat) / 2,
        (startCoords.lng + endCoords.lng) / 2,
        e.latitude, e.longitude
      );
      return dist < 5;
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
        totalDistance,
        walkingTime: timeMinutes,
      });

      const formattedDirections = aiResponse.directions.map(dir => ({
        ...dir,
        distance: dir.distance.startsWith('(') ? dir.distance : `(${dir.distance})`,
      }));

      setRouteGeometry(aiResponse.routeGeometry || null);
      setAltRouteGeometry(aiResponse.alternativeRoute?.routeGeometry || null);

      const distKm = aiResponse.distance ? (aiResponse.distance / 1000).toFixed(2) + ' km' : (totalDistance < 1 ? `${Math.round(totalDistance * 1000)} m` : `${totalDistance.toFixed(2)} km`);
      const durMin = aiResponse.duration ? Math.round(aiResponse.duration / 60) + ' min' : `${timeMinutes} min`;

      setRouteInfo({
        distance: distKm,
        time: durMin,
        hasHazard: aiResponse.hazardStatus !== 'ROUTE_CLEAR',
        hazardCount: aiResponse.hazardCount || hazardsOnRoute.length,
        directions: formattedDirections,
        nearbyEvacCount: nearbyEvacCenters.length,
        summary: aiResponse.summary,
        hazardStatus: aiResponse.hazardStatus,
        alternativeRoute: aiResponse.alternativeRoute,
        safetyReminders: aiResponse.safetyReminders,
      });

      setRouteGenerated(true);

      if (aiResponse.hazardStatus === 'ROUTE_CLEAR') {
        toast({ title: '✅ Safe Route Generated', description: 'Route is clear of reported hazards.' });
      } else if (aiResponse.hazardStatus === 'ALTERNATIVE_ROUTE_USED') {
        toast({ title: '🔀 Alternative Route Available', description: 'A safer route was selected. Alternative route shown as dashed line.' });
      } else {
        toast({ title: '⚠️ Hazard Warning', description: 'No hazard-free route available. Proceed with caution.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Route generation failed, using fallback:', error);
      
      setRouteGeometry(null);
      setAltRouteGeometry(null);

      setRouteInfo({
        distance: totalDistance < 1 ? `${Math.round(totalDistance * 1000)} m` : `${totalDistance.toFixed(2)} km`,
        time: timeMinutes < 60 ? `${timeMinutes} min` : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`,
        hasHazard: hazardsOnRoute.length > 0,
        hazardCount: hazardsOnRoute.length,
        directions: [],
        nearbyEvacCount: nearbyEvacCenters.length,
        hazardStatus: hazardsOnRoute.length > 0 ? 'HAZARDS_PRESENT_NO_ALTERNATIVE' : 'ROUTE_CLEAR',
      });

      setRouteGenerated(true);
      toast({ title: '📍 Route Generated', description: 'Using estimated directions. Route service temporarily unavailable.' });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const handleReset = () => {
    setRouteGenerated(false);
    setRouteInfo(null);
    setRouteGeometry(null);
    setAltRouteGeometry(null);
    setShowAltDirections(false);
    setStartCoords(null);
    setEndCoords(null);
    setMapReady(false);
    setStartLatInput('');
    setStartLngInput('');
    setEndLatInput('');
    setEndLngInput('');
    setSelectedEvac('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }
  };

  const canGenerate = startCoords && endCoords;

  const getInitialHeading = () => {
    if (!startCoords || !endCoords) return 'North';
    const latDiff = endCoords.lat - startCoords.lat;
    const lngDiff = endCoords.lng - startCoords.lng;
    const nsDirection = latDiff > 0 ? 'North' : 'South';
    const ewDirection = lngDiff > 0 ? 'East' : 'West';
    if (Math.abs(latDiff) < 0.001) return ewDirection;
    if (Math.abs(lngDiff) < 0.001) return nsDirection;
    return `${nsDirection}-${ewDirection}`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ROUTE_CLEAR':
        return { label: t.routeClear, className: 'bg-green-500 text-white' };
      case 'ALTERNATIVE_ROUTE_USED':
        return { label: t.altRouteUsed, className: 'bg-blue-500 text-white' };
      case 'HAZARDS_PRESENT_NO_ALTERNATIVE':
        return { label: t.hazardsPresent, className: 'bg-amber-400 text-amber-900' };
      default:
        return { label: t.routeClear, className: 'bg-green-500 text-white' };
    }
  };

  if (routeGenerated && routeInfo) {
    const initialHeading = getInitialHeading();
    const badge = getStatusBadge(routeInfo.hazardStatus);
    const activeDirections = showAltDirections && routeInfo.alternativeRoute 
      ? routeInfo.alternativeRoute.directions 
      : routeInfo.directions;
    
    return (
      <div className="h-[calc(100vh-8rem)] md:h-screen flex flex-col bg-background">
        {/* Result Map */}
        <div className="h-[40%] relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Route Legend */}
          <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border text-xs">
            <p className="font-semibold mb-1">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>End</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500" />
                <span>Primary Route</span>
              </div>
              {altRouteGeometry && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" />
                  <span>Alternative Route</span>
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReset} 
            className="absolute top-3 left-3 bg-background/90 hover:bg-background shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Coordinates Display */}
        <div className="px-4 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
          <p>Start: {startCoords?.lat.toFixed(4)}, {startCoords?.lng.toFixed(4)}</p>
          <p>Destination: {endCoords?.lat.toFixed(4)}, {endCoords?.lng.toFixed(4)}</p>
        </div>

        {/* Route Details Panel */}
        <div className="flex-1 overflow-y-auto">
          <Card className="mx-3 my-3 border-2">
            <CardContent className="p-4">
              {/* Distance, Duration & Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-6">
                  <div>
                     <p className="text-xs text-muted-foreground">{t.distance}:</p>
                     <p className="text-xl font-bold text-foreground">{routeInfo.distance}</p>
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">{t.estTime} (🏍️):</p>
                     <p className="text-xl font-bold text-foreground">{routeInfo.time}</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide ${badge.className}`}>
                  {badge.label}
                </div>
              </div>

              {/* Route context message */}
              {routeInfo.summary && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${
                  routeInfo.hazardStatus === 'ROUTE_CLEAR' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : routeInfo.hazardStatus === 'ALTERNATIVE_ROUTE_USED'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  {routeInfo.summary}
                </div>
              )}

              {/* Alternative Route Toggle */}
              {routeInfo.alternativeRoute && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!showAltDirections ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowAltDirections(false)}
                  >
                    {t.primaryRoute}
                  </Button>
                  <Button
                    variant={showAltDirections ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowAltDirections(true)}
                  >
                    {t.alternativeRoute}
                  </Button>
                </div>
              )}

              {/* Alt route summary when viewing it */}
              {showAltDirections && routeInfo.alternativeRoute && (
                <div className="p-3 bg-muted/50 rounded-lg mb-4 text-sm text-muted-foreground">
                  {routeInfo.alternativeRoute.summary}
                </div>
              )}

              {/* Turn-by-turn Directions */}
              <div className="space-y-1 mb-4 text-sm">
                <p className="text-muted-foreground">
                  <span className="inline-block w-16">(Start)</span>
                  Head {initialHeading}
                </p>
                
                {activeDirections.map((dir, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-muted-foreground w-16 flex-shrink-0">
                      {dir.distance.startsWith('(') ? dir.distance : `(${dir.distance})`}
                    </span>
                    <span className={dir.hasHazard ? 'text-amber-600 font-medium' : 'text-foreground'}>
                      {dir.instruction}
                      {dir.hasHazard && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
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

              {/* Hazard warnings with details */}
              {routeInfo.hasHazard && routeInfo.directions.some(d => d.hazardWarning) && (
                <div className="space-y-2 mb-4">
                  {routeInfo.directions.filter(d => d.hazardWarning).map((dir, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{dir.hazardWarning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Safety Reminders */}
              {routeInfo.safetyReminders && routeInfo.safetyReminders.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-800">{t.safetyReminders}</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {routeInfo.safetyReminders.map((reminder, idx) => (
                      <li key={idx} className="text-sm text-red-700">{reminder}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Location Summary */}
              <div className="pt-3 border-t text-xs text-muted-foreground">
                <p>Naval, Biliran • {routeInfo.hazardCount} hazard{routeInfo.hazardCount !== 1 ? 's' : ''} • {routeInfo.nearbyEvacCount} evacuation center{routeInfo.nearbyEvacCount !== 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action */}
        <div className="p-3 bg-background border-t">
          <Button onClick={handleReset} variant="outline" className="w-full">
            <Route className="w-4 h-4 mr-2" />
            {t.planNewRoute}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t.planSafeRoute}</h1>
          <p className="text-sm text-primary-foreground/80">{t.motorcycleRouting}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Start Point Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              {t.startingPoint}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {startCoords ? `${startCoords.lat.toFixed(6)}, ${startCoords.lng.toFixed(6)}` : t.notSet}
              </span>
            </div>

            <Tabs value={startInputMode} onValueChange={(v) => setStartInputMode(v as 'map' | 'coords')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{t.pickOnMap}</TabsTrigger>
                <TabsTrigger value="coords" className="text-xs"><Keyboard className="w-3 h-3 mr-1" />{t.coordinates}</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-3">
                <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50" onClick={() => openPicker('start')}>
                  <MapPin className="w-4 h-4 mr-2" />{t.pinStartOnMap}
                </Button>
              </TabsContent>

              <TabsContent value="coords" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">{t.latitude}</Label><Input type="number" step="any" placeholder="11.5601" value={startLatInput} onChange={(e) => setStartLatInput(e.target.value)} /></div>
                  <div><Label className="text-xs">{t.longitude}</Label><Input type="number" step="any" placeholder="124.3949" value={startLngInput} onChange={(e) => setStartLngInput(e.target.value)} /></div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleSetStartCoords}>{t.setCoordinates}</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Destination Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              {t.destination}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {endCoords 
                  ? selectedEvac 
                    ? evacCenters.find(c => c.id === selectedEvac)?.name || `${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}`
                    : `${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}`
                  : t.notSet}
              </span>
            </div>

            <Tabs value={endInputMode} onValueChange={(v) => setEndInputMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{t.pickOnMap}</TabsTrigger>
                <TabsTrigger value="coords" className="text-xs"><Keyboard className="w-3 h-3 mr-1" />{t.coordinates}</TabsTrigger>
                <TabsTrigger value="evac" className="text-xs"><Building2 className="w-3 h-3 mr-1" />{t.evacCenter}</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-3">
                <Button variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50" onClick={() => openPicker('end')}>
                  <MapPin className="w-4 h-4 mr-2" />{t.pinDestOnMap}
                </Button>
              </TabsContent>

              <TabsContent value="coords" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">{t.latitude}</Label><Input type="number" step="any" placeholder="11.5601" value={endLatInput} onChange={(e) => setEndLatInput(e.target.value)} /></div>
                  <div><Label className="text-xs">{t.longitude}</Label><Input type="number" step="any" placeholder="124.3949" value={endLngInput} onChange={(e) => setEndLngInput(e.target.value)} /></div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleSetEndCoords}>{t.setCoordinates}</Button>
              </TabsContent>

              <TabsContent value="evac" className="mt-3">
                <Select value={selectedEvac} onValueChange={handleSelectEvac}>
                  <SelectTrigger><SelectValue placeholder={t.chooseEvacCenter} /></SelectTrigger>
                  <SelectContent>
                    {evacCenters.length === 0 ? (
                      <SelectItem value="none" disabled>{t.noEvacAvailable}</SelectItem>
                    ) : (
                      evacCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>🏠 {center.name} - {center.location}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Generate Route Button */}
        <Button className="w-full h-12 text-base" disabled={!canGenerate || isGeneratingRoute} onClick={handleGenerateRoute}>
          {isGeneratingRoute ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.generatingRoute}</>
          ) : (
            <><Navigation className="w-5 h-5 mr-2" />{t.generateSafeRouteBtn}</>
          )}
        </Button>

        {!canGenerate && (
          <p className="text-sm text-muted-foreground text-center">
            {t.setBothPoints}
          </p>
        )}
      </div>

      <MapPickerModal
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onConfirm={handlePickerConfirm}
        mode={pickerMode}
        initialCoords={pickerMode === 'start' ? startCoords : endCoords}
      />
    </div>
  );
};

export default FindRoutePage;
