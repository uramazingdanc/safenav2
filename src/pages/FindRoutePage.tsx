import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ArrowLeft, Route, Clock, Ruler, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveHazards } from '@/hooks/useHazards';
import MapPickerModal from '@/components/MapPickerModal';

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
    fill: new Fill({ color: '#22c55e' }), // Green
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
    fill: new Fill({ color: '#ef4444' }), // Red
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
  text: new OLText({
    text: 'E',
    font: 'bold 10px sans-serif',
    fill: new Fill({ color: '#ffffff' }),
  }),
});

const routeStyle = new Style({
  stroke: new Stroke({
    color: '#3b82f6',
    width: 5,
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

  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [routeGenerated, setRouteGenerated] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string; hasHazard: boolean } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const hazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const defaultCenter = { lat: 11.5601, lng: 124.3949 };

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

  // Initialize result map
  useEffect(() => {
    if (!routeGenerated || !mapRef.current) return;

    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const markersSource = new VectorSource();
      const routeSource = new VectorSource();
      const hazardSource = new VectorSource();

      const markersLayer = new VectorLayer({ source: markersSource, zIndex: 20 });
      const routeLayer = new VectorLayer({ source: routeSource, zIndex: 5 });
      const hazardLayer = new VectorLayer({ source: hazardSource, zIndex: 10 });

      markersLayerRef.current = markersLayer;
      routeLayerRef.current = routeLayer;
      hazardLayerRef.current = hazardLayer;

      const map = new OLMap({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
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
    const hazardSource = hazardLayerRef.current?.getSource();

    if (!markersSource || !routeSource || !hazardSource) return;

    // Clear previous
    markersSource.clear();
    routeSource.clear();
    hazardSource.clear();

    // Add start marker (green)
    const startFeature = new Feature({
      geometry: new Point(fromLonLat([startCoords.lng, startCoords.lat])),
    });
    startFeature.setStyle(startPinStyle);
    markersSource.addFeature(startFeature);

    // Add end marker (red)
    const endFeature = new Feature({
      geometry: new Point(fromLonLat([endCoords.lng, endCoords.lat])),
    });
    endFeature.setStyle(endPinStyle);
    markersSource.addFeature(endFeature);

    // Generate simple route (straight line with some interpolation)
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

    // Add hazard markers near route
    const routeBuffer = 0.02; // ~2km buffer
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
        const feature = new Feature({
          geometry: new Point(fromLonLat([hazard.longitude, hazard.latitude])),
        });
        feature.setStyle(getHazardStyle(hazard.type, hazard.severity));
        hazardSource.addFeature(feature);
      }
    });

    // Fit view to show entire route
    const extent = routeSource.getExtent();
    mapInstanceRef.current?.getView().fit(extent, {
      padding: [60, 60, 60, 60],
      maxZoom: 16,
      duration: 500,
    });

  }, [mapReady, startCoords, endCoords, hazards]);

  const openPicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setIsPickerOpen(true);
  };

  const handlePickerConfirm = (coords: { lat: number; lng: number }) => {
    if (pickerMode === 'start') {
      setStartCoords(coords);
    } else {
      setEndCoords(coords);
    }
  };

  const handleGenerateRoute = () => {
    if (!startCoords || !endCoords) return;
    
    // Calculate distance and estimated time
    const distance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const walkingSpeed = 5; // km/h
    const timeMinutes = Math.round((distance / walkingSpeed) * 60);

    // Check for hazards along route
    const routeBuffer = 0.01;
    const hasHazardOnRoute = hazards.some(h => {
      if (!h.latitude || !h.longitude) return false;
      const midLat = (startCoords.lat + endCoords.lat) / 2;
      const midLng = (startCoords.lng + endCoords.lng) / 2;
      const dist = Math.sqrt(
        Math.pow(h.latitude - midLat, 2) + Math.pow(h.longitude - midLng, 2)
      );
      return dist < routeBuffer;
    });

    setRouteInfo({
      distance: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`,
      time: timeMinutes < 60 ? `${timeMinutes} min` : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`,
      hasHazard: hasHazardOnRoute,
    });

    setRouteGenerated(true);

    if (hasHazardOnRoute) {
      toast({
        title: '⚠️ Hazard Warning',
        description: 'Your route passes near known hazard zones. Consider an alternative path.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✅ Safe Route',
        description: 'Your route avoids known hazard zones.',
      });
    }
  };

  const handleReset = () => {
    setRouteGenerated(false);
    setRouteInfo(null);
    setStartCoords(null);
    setEndCoords(null);
    setMapReady(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }
  };

  const canGenerate = startCoords && endCoords;

  // Generate simple directions based on coordinates
  const generateDirections = () => {
    if (!startCoords || !endCoords) return [];
    
    const latDiff = endCoords.lat - startCoords.lat;
    const lngDiff = endCoords.lng - startCoords.lng;
    
    const nsDirection = latDiff > 0 ? 'North' : 'South';
    const ewDirection = lngDiff > 0 ? 'East' : 'West';
    
    const distance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const distanceStr = distance < 1 ? `${Math.round(distance * 1000)} meters` : `${distance.toFixed(1)} km`;
    
    return [
      { step: 1, instruction: `Start from your current location`, icon: '📍' },
      { step: 2, instruction: `Head ${nsDirection}${ewDirection !== 'East' && ewDirection !== 'West' ? '' : `-${ewDirection}`}`, icon: '🧭' },
      { step: 3, instruction: `Continue for approximately ${distanceStr}`, icon: '🚶' },
      { step: 4, instruction: `Look for landmarks and follow main roads`, icon: '🛤️' },
      { step: 5, instruction: `Arrive at your destination`, icon: '🎯' },
    ];
  };

  if (routeGenerated) {
    const directions = generateDirections();
    
    return (
      <div className="h-[calc(100vh-8rem)] md:h-screen flex flex-col">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleReset} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Route Result</h1>
            <p className="text-xs text-primary-foreground/80">
              Your safe route has been generated
            </p>
          </div>
        </div>

        {/* Route Info Cards */}
        <div className="p-4 bg-background border-b space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-center">
                <Ruler className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-primary">{routeInfo?.distance}</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-primary">{routeInfo?.time}</p>
                <p className="text-xs text-muted-foreground">Est. Walking Time</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Safety Status */}
          <Card className={routeInfo?.hasHazard ? 'bg-destructive/10 border-destructive/30' : 'bg-green-50 border-green-200'}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${routeInfo?.hasHazard ? 'bg-destructive/20' : 'bg-green-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${routeInfo?.hasHazard ? 'text-destructive' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`font-semibold ${routeInfo?.hasHazard ? 'text-destructive' : 'text-green-700'}`}>
                  {routeInfo?.hasHazard ? 'Caution Required' : 'Route is Clear'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {routeInfo?.hasHazard 
                    ? 'Hazards detected near your route. Proceed with caution.'
                    : 'No known hazards detected along your route.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Result Map */}
          <div className="h-[250px] relative mx-4 my-3 rounded-xl overflow-hidden border shadow-lg">
            <div ref={mapRef} className="w-full h-full" />
            
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Reminder Card */}
            <div className="absolute top-2 left-2 right-2 bg-amber-50 border border-amber-200 rounded-lg p-2 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">Safety Reminder</p>
                  <p>Stay alert and follow local authorities' instructions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* V11-Style Directions Panel */}
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Directions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {directions.map((dir, idx) => (
                  <div 
                    key={dir.step} 
                    className={`flex items-start gap-3 p-2 rounded-lg ${
                      idx === 0 ? 'bg-green-50 border border-green-200' :
                      idx === directions.length - 1 ? 'bg-primary/5 border border-primary/20' :
                      'bg-muted/30'
                    }`}
                  >
                    <span className="text-lg">{dir.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{dir.instruction}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Step {dir.step}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Route Legend */}
          <Card className="mx-4 mb-4">
            <CardContent className="p-3">
              <p className="text-xs font-semibold mb-2">Route Legend</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
                  <span>Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
                  <span>Destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-blue-500 rounded" />
                  <span>Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Hazard Zone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action */}
        <div className="p-4 bg-background border-t">
          <Button onClick={handleReset} variant="outline" className="w-full">
            <Route className="w-4 h-4 mr-2" />
            Plan New Route
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Plan Safe Route</h1>
          <p className="text-sm text-primary-foreground/80">Set your start and destination points</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Start Point Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Starting Point
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {startCoords 
                  ? `${startCoords.lat.toFixed(6)}, ${startCoords.lng.toFixed(6)}`
                  : 'Not set'
                }
              </span>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => openPicker('start')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              📍 Pin Start on Map
            </Button>
          </CardContent>
        </Card>

        {/* Destination Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {endCoords 
                  ? `${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}`
                  : 'Not set'
                }
              </span>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => openPicker('end')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              📍 Pin Destination on Map
            </Button>
          </CardContent>
        </Card>

        {/* Generate Route Button */}
        <Button 
          className="w-full h-12 text-base"
          disabled={!canGenerate}
          onClick={handleGenerateRoute}
        >
          <Navigation className="w-5 h-5 mr-2" />
          Generate Safe Route
        </Button>

        {!canGenerate && (
          <p className="text-sm text-muted-foreground text-center">
            Please set both start and destination points to generate a route
          </p>
        )}
      </div>

      {/* Map Picker Modal */}
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
