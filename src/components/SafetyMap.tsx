import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader2, Info, Route, X, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useActiveHazards } from '@/hooks/useHazards';
import { useOpenEvacuationCenters } from '@/hooks/useEvacuationCenters';
import WeatherCard from '@/components/WeatherCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

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

// Hazard types - Updated to match requirements
const HAZARD_TYPES = ['flooding', 'landslide', 'road_damage', 'road_obstruction', 'other'];

// Emoji mapping for hazard types
const getHazardEmoji = (type: string): string => {
  const typeNormalized = type.toLowerCase();
  if (typeNormalized.includes('flood')) return '🌊';
  if (typeNormalized.includes('landslide')) return '⛰️';
  if (typeNormalized.includes('road') && typeNormalized.includes('damage')) return '🚧';
  if (typeNormalized.includes('road') && typeNormalized.includes('obstruction')) return '🚗';
  if (typeNormalized.includes('other')) return '⚠️';
  return '⚠️';
};

// Severity-based colors
const getSeverityColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    low: '#eab308',      // Yellow
    medium: '#f97316',   // Orange
    high: '#dc2626',     // Red
    critical: '#991b1b', // Dark Red
  };
  return colorMap[severity] || '#dc2626';
};

// Create hazard style with emoji
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

// Marker styles
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

const routeStyle = new Style({
  stroke: new Stroke({
    color: '#3b82f6',
    width: 5,
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
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [isSelectingRoute, setIsSelectingRoute] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const { t } = useLanguage();
  const { toast } = useToast();

  // Fetch real data from database
  const { data: hazards = [], isLoading: hazardsLoading } = useActiveHazards();
  const { data: evacCenters = [], isLoading: evacLoading } = useOpenEvacuationCenters();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const userLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const hazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const evacLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routePointsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Default center (Naval, Biliran, Philippines) - [lng, lat] for OpenLayers
  const defaultCenter: [number, number] = [124.3989, 11.5669];

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
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

    // Create vector sources
    const hazardSource = new VectorSource();
    const evacSource = new VectorSource();
    const userSource = new VectorSource();
    const routeSource = new VectorSource();
    const routePointsSource = new VectorSource();

    // Create layers
    const hazardLayer = new VectorLayer({ source: hazardSource, zIndex: 10 });
    const evacLayer = new VectorLayer({ source: evacSource, zIndex: 10 });
    const userLayer = new VectorLayer({ source: userSource, zIndex: 15 });
    const routeLayer = new VectorLayer({ source: routeSource, zIndex: 5 });
    const routePointsLayer = new VectorLayer({ source: routePointsSource, zIndex: 20 });

    userLayerRef.current = userLayer;
    routeLayerRef.current = routeLayer;
    hazardLayerRef.current = hazardLayer;
    evacLayerRef.current = evacLayer;
    routePointsLayerRef.current = routePointsLayer;

    // Create popup overlay
    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: true,
    });
    overlayRef.current = overlay;

    // Create map
    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
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
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for route selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (evt: any) => {
      // If in selection mode, set coordinates
      if (selectionMode) {
        const coordinate = toLonLat(evt.coordinate);
        const coords = { lat: coordinate[1], lng: coordinate[0] };
        
        if (selectionMode === 'start') {
          setStartCoords(coords);
          toast({
            title: '✅ Start Point Set',
            description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
          });
        } else {
          setEndCoords(coords);
          toast({
            title: '✅ Destination Set',
            description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
          });
        }
        setSelectionMode(null);
        return;
      }

      // Otherwise show popup
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const coordinates = (feature.getGeometry() as Point).getCoordinates();
        const name = feature.get('name');
        const featureType = feature.get('featureType');
        const type = feature.get('type');
        const severity = feature.get('severity');
        const status = feature.get('status');
        const location = feature.get('location');

        if (popupRef.current && overlayRef.current) {
          let content = '';
          if (featureType === 'hazard') {
            const emoji = getHazardEmoji(type);
            const severityColors: Record<string, string> = {
              low: 'text-yellow-500',
              medium: 'text-orange-500',
              high: 'text-red-500',
              critical: 'text-red-700',
            };
            content = `<div class="text-center p-2">
              <span class="text-2xl">${emoji}</span><br/>
              <strong class="${severityColors[severity] || 'text-red-600'}">${type}</strong>
              <p class="text-xs capitalize font-semibold ${severityColors[severity]}">Severity: ${severity}</p>
              <p class="text-xs">${location}</p>
            </div>`;
          } else if (featureType === 'evac') {
            content = `<div class="text-center p-2">
              <span class="text-2xl">🏠</span><br/>
              <strong class="text-green-600">${name}</strong>
              <p class="text-xs">Status: ${status}</p>
              <p class="text-xs">${location}</p>
            </div>`;
          } else if (featureType === 'user') {
            content = `<div class="text-center p-2"><span class="text-xl">📍</span><br/><strong>Your Location</strong></div>`;
          }
          popupRef.current.innerHTML = content;
          overlayRef.current.setPosition(coordinates);
        }
      } else if (!selectionMode) {
        overlayRef.current?.setPosition(undefined);
      }
    };

    map.on('click', handleClick);

    // Change cursor based on mode
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

  // Update hazard markers when data changes (with emoji icons)
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
          featureType: 'hazard',
        });
        feature.setStyle(getHazardStyle(hazard.type, hazard.severity));
        source.addFeature(feature);
      }
    });
  }, [hazards]);

  // Update evacuation center markers when data changes
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

      // Center map on user location
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([userLocation[1], userLocation[0]]),
        zoom: 14,
        duration: 500,
      });
    }
  }, [userLocation]);

  // Update route points and line
  useEffect(() => {
    if (!routePointsLayerRef.current || !routeLayerRef.current) return;

    const pointsSource = routePointsLayerRef.current.getSource();
    const routeSource = routeLayerRef.current.getSource();
    if (!pointsSource || !routeSource) return;

    pointsSource.clear();
    routeSource.clear();

    // Add start marker
    if (startCoords) {
      const startFeature = new Feature({
        geometry: new Point(fromLonLat([startCoords.lng, startCoords.lat])),
      });
      startFeature.setStyle(startPinStyle);
      pointsSource.addFeature(startFeature);
    }

    // Add end marker
    if (endCoords) {
      const endFeature = new Feature({
        geometry: new Point(fromLonLat([endCoords.lng, endCoords.lat])),
      });
      endFeature.setStyle(endPinStyle);
      pointsSource.addFeature(endFeature);
    }

    // Draw route line if both points are set and route is generated
    if (startCoords && endCoords && routeGenerated) {
      const routeCoords = [
        [startCoords.lng, startCoords.lat],
        [(startCoords.lng + endCoords.lng) / 2 + 0.002, (startCoords.lat + endCoords.lat) / 2 + 0.001],
        [endCoords.lng, endCoords.lat],
      ].map(coord => fromLonLat(coord));

      const routeFeature = new Feature({
        geometry: new LineString(routeCoords),
      });
      routeFeature.setStyle(routeStyle);
      routeSource.addFeature(routeFeature);

      // Fit view to show entire route
      const extent = routeSource.getExtent();
      mapInstanceRef.current?.getView().fit(extent, {
        padding: [60, 60, 60, 60],
        maxZoom: 16,
        duration: 500,
      });
    }
  }, [startCoords, endCoords, routeGenerated]);

  const handleStartSelection = useCallback((mode: 'start' | 'end') => {
    setSelectionMode(mode);
    setIsSelectingRoute(true);
    overlayRef.current?.setPosition(undefined);
    toast({
      title: mode === 'start' ? '📍 Select Start Point' : '🎯 Select Destination',
      description: 'Tap anywhere on the map to set the location',
    });
  }, [toast]);

  const handleGenerateRoute = useCallback(() => {
    if (!startCoords || !endCoords) {
      toast({
        title: 'Missing Points',
        description: 'Please set both start and destination points',
        variant: 'destructive',
      });
      return;
    }

    // Calculate distance and estimated time
    const distance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const walkingSpeed = 5; // km/h
    const timeMinutes = Math.round((distance / walkingSpeed) * 60);

    setRouteInfo({
      distance: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`,
      time: timeMinutes < 60 ? `${timeMinutes} min` : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`,
    });

    setRouteGenerated(true);

    // Check if route passes through hazard zones
    const routeBuffer = 0.01; // ~1km buffer
    const hazardsOnRoute = hazards.filter((hazard) => {
      if (!hazard.latitude || !hazard.longitude) return false;
      const midLat = (startCoords.lat + endCoords.lat) / 2;
      const midLng = (startCoords.lng + endCoords.lng) / 2;
      const dist = Math.sqrt(
        Math.pow(hazard.latitude - midLat, 2) + Math.pow(hazard.longitude - midLng, 2)
      );
      return dist < routeBuffer;
    });

    if (hazardsOnRoute.length > 0) {
      toast({
        title: '⚠️ Hazard Warning',
        description: `Your route passes near ${hazardsOnRoute.length} known hazard zone(s). Proceed with caution!`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✅ Safe Route Generated',
        description: 'Your route avoids known hazard zones.',
      });
    }
  }, [startCoords, endCoords, hazards, toast]);

  const handleClearRoute = useCallback(() => {
    setStartCoords(null);
    setEndCoords(null);
    setRouteGenerated(false);
    setRouteInfo(null);
    setIsSelectingRoute(false);
    setSelectionMode(null);
  }, []);

  const isLoading = hazardsLoading || evacLoading;

  const canGenerateRoute = startCoords && endCoords && !routeGenerated;

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Hazard Map
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            ☁️ Weather
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
              {startCoords ? '✓ Start Set' : 'Pin Start'}
            </Button>
            <Button 
              variant={selectionMode === 'end' ? 'default' : 'outline'} 
              size="sm" 
              className="flex-1"
              onClick={() => handleStartSelection('end')}
            >
              <Navigation className="w-4 h-4 mr-1" />
              {endCoords ? '✓ End Set' : 'Pin End'}
            </Button>
          </div>

          {/* Selection Mode Indicator */}
          {selectionMode && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${selectionMode === 'start' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Tap map to set {selectionMode === 'start' ? 'START' : 'DESTINATION'}
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
                disabled={!canGenerateRoute}
                onClick={handleGenerateRoute}
              >
                <Route className="w-4 h-4 mr-2" />
                {routeGenerated ? 'Route Generated' : 'Generate Route'}
              </Button>
              <Button variant="outline" onClick={handleClearRoute}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Container with Floating Legend */}
      <div className="flex-1 mx-4 mb-4 rounded-xl overflow-hidden shadow-lg border min-h-[350px] relative">
        <div ref={mapRef} className="w-full h-full min-h-[350px]" />
        
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setShowLegend(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-medium text-muted-foreground">Hazard Types:</p>
              <div className="flex items-center gap-2">
                <span className="text-base">🌊</span>
                <span>Flood</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">⛰️</span>
                <span>Landslide</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚧</span>
                <span>Road Damage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚗</span>
                <span>Road Obstruction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>Other</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🏠</span>
                <span>Evac Center ({evacCenters.length})</span>
              </div>
              <div className="border-t border-muted my-2" />
              <p className="font-medium text-muted-foreground">Severity Colors:</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-800 border-2 border-white shadow" />
                <span>Critical</span>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1 text-muted-foreground mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Popup Container */}
        <div 
          ref={popupRef} 
          className="ol-popup bg-background rounded-lg shadow-lg border"
          style={{ position: 'absolute', minWidth: '120px' }}
        />

        {/* Route Info Overlay */}
        {routeGenerated && routeInfo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border z-10 min-w-[280px]">
            <p className="text-sm font-medium text-center mb-2">🗺️ Route Generated</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{routeInfo.distance}</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{routeInfo.time}</p>
                <p className="text-xs text-muted-foreground">Est. Time</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-muted">
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Stay alert and follow safety protocols
              </p>
            </div>
          </div>
        )}
      </div>

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
