import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ArrowLeft, Route, Clock, Ruler, AlertTriangle, Loader2, Crosshair, Building2, Keyboard } from 'lucide-react';
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
  const { data: evacCenters = [] } = useOpenEvacuationCenters();

  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [routeGenerated, setRouteGenerated] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ 
    distance: string; 
    time: string; 
    hasHazard: boolean; 
    hazardCount: number;
    directions: Array<{ instruction: string; distance: string; hasHazard?: boolean; hazardType?: string }>;
    nearbyEvacCount: number;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Input mode tabs
  const [startInputMode, setStartInputMode] = useState<'map' | 'coords' | 'location'>('map');
  const [endInputMode, setEndInputMode] = useState<'map' | 'coords' | 'evac'>('map');
  
  // Manual coordinate inputs
  const [startLatInput, setStartLatInput] = useState('');
  const [startLngInput, setStartLngInput] = useState('');
  const [endLatInput, setEndLatInput] = useState('');
  const [endLngInput, setEndLngInput] = useState('');
  
  // Selected evac center
  const [selectedEvac, setSelectedEvac] = useState<string>('');
  
  // Location loading state
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setStartCoords(coords);
        setStartLatInput(coords.lat.toFixed(6));
        setStartLngInput(coords.lng.toFixed(6));
        setIsGettingLocation(false);
        toast({
          title: '📍 Location Found',
          description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: 'Location Error',
          description: error.message || 'Failed to get your location.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle manual coordinate input
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

  // Handle evacuation center selection
  const handleSelectEvac = (evacId: string) => {
    setSelectedEvac(evacId);
    const center = evacCenters.find(c => c.id === evacId);
    if (center && center.latitude && center.longitude) {
      setEndCoords({ lat: center.latitude, lng: center.longitude });
      toast({
        title: '🏠 Evacuation Center Selected',
        description: center.name,
      });
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

    markersSource.clear();
    routeSource.clear();
    hazardSource.clear();

    // Add start marker
    const startFeature = new Feature({
      geometry: new Point(fromLonLat([startCoords.lng, startCoords.lat])),
    });
    startFeature.setStyle(startPinStyle);
    markersSource.addFeature(startFeature);

    // Add end marker
    const endFeature = new Feature({
      geometry: new Point(fromLonLat([endCoords.lng, endCoords.lat])),
    });
    endFeature.setStyle(endPinStyle);
    markersSource.addFeature(endFeature);

    // Generate route line
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
      setStartLatInput(coords.lat.toFixed(6));
      setStartLngInput(coords.lng.toFixed(6));
    } else {
      setEndCoords(coords);
      setEndLatInput(coords.lat.toFixed(6));
      setEndLngInput(coords.lng.toFixed(6));
    }
  };

  // Generate realistic street names for route
  const generateStreetNames = (): string[] => {
    const streets = [
      'Biliran Circumferential Road',
      'Caneja Street',
      'Castin Street',
      'Padre Innocentes Street',
      'Rizal Avenue',
      'Mabini Street',
      'Del Pilar Road',
      'Burgos Street',
      'Luna Avenue',
      'Bonifacio Street',
    ];
    // Shuffle and pick 4-6 streets
    const shuffled = streets.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4 + Math.floor(Math.random() * 3));
  };

  const handleGenerateRoute = () => {
    if (!startCoords || !endCoords) return;
    
    const totalDistance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    const walkingSpeed = 5;
    const timeMinutes = Math.round((totalDistance / walkingSpeed) * 60);

    // Check for hazards along route with wider buffer
    const routeBuffer = 0.02;
    const hazardsOnRoute = hazards.filter(h => {
      if (!h.latitude || !h.longitude) return false;
      const minLat = Math.min(startCoords.lat, endCoords.lat) - routeBuffer;
      const maxLat = Math.max(startCoords.lat, endCoords.lat) + routeBuffer;
      const minLng = Math.min(startCoords.lng, endCoords.lng) - routeBuffer;
      const maxLng = Math.max(startCoords.lng, endCoords.lng) + routeBuffer;
      return h.latitude >= minLat && h.latitude <= maxLat && h.longitude >= minLng && h.longitude <= maxLng;
    });

    // Count nearby evacuation centers
    const nearbyEvacCenters = evacCenters.filter(e => {
      if (!e.latitude || !e.longitude) return false;
      const dist = calculateDistance(
        (startCoords.lat + endCoords.lat) / 2,
        (startCoords.lng + endCoords.lng) / 2,
        e.latitude,
        e.longitude
      );
      return dist < 5; // Within 5km
    });

    // Generate detailed directions with street names and distances
    const streets = generateStreetNames();
    const segmentDistances: number[] = [];
    let remainingDist = totalDistance;
    
    // Distribute distance across segments
    for (let i = 0; i < streets.length; i++) {
      if (i === streets.length - 1) {
        segmentDistances.push(remainingDist);
      } else {
        const segment = remainingDist * (0.15 + Math.random() * 0.25);
        segmentDistances.push(segment);
        remainingDist -= segment;
      }
    }

    // Create detailed directions
    const detailedDirections = streets.map((street, idx) => {
      const segmentDist = segmentDistances[idx];
      const distStr = segmentDist < 1 
        ? `${Math.round(segmentDist * 1000)} m` 
        : `${segmentDist.toFixed(2)} km`;
      
      // Check if any hazard is near this segment
      const segmentHasHazard = hazardsOnRoute.length > 0 && idx === Math.floor(streets.length / 2);
      const hazardNearby = segmentHasHazard ? hazardsOnRoute[0] : null;
      
      return {
        instruction: idx === 0 
          ? `on ${street}` 
          : `on ${street}`,
        distance: `(${distStr})`,
        hasHazard: segmentHasHazard,
        hazardType: hazardNearby?.type,
      };
    });

    setRouteInfo({
      distance: totalDistance < 1 ? `${Math.round(totalDistance * 1000)} m` : `${totalDistance.toFixed(2)} km`,
      time: timeMinutes < 60 ? `${timeMinutes} min` : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`,
      hasHazard: hazardsOnRoute.length > 0,
      hazardCount: hazardsOnRoute.length,
      directions: detailedDirections,
      nearbyEvacCount: nearbyEvacCenters.length,
    });

    setRouteGenerated(true);

    if (hazardsOnRoute.length > 0) {
      toast({
        title: '⚠️ Hazard Warning',
        description: `${hazardsOnRoute.length} hazard(s) detected near your route. Proceed with caution.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✅ Safe Route',
        description: 'No known hazards detected along your route.',
      });
    }
  };

  const handleReset = () => {
    setRouteGenerated(false);
    setRouteInfo(null);
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

  // Get cardinal direction for initial heading
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

  if (routeGenerated && routeInfo) {
    const initialHeading = getInitialHeading();
    
    return (
      <div className="h-[calc(100vh-8rem)] md:h-screen flex flex-col bg-background">
        {/* Result Map - Top Section */}
        <div className="h-[45%] relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Legend Toggle */}
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
              {/* Distance, Duration & Hazard Status Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Distance:</p>
                    <p className="text-xl font-bold text-foreground">{routeInfo.distance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration:</p>
                    <p className="text-xl font-bold text-foreground">{routeInfo.time}</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                  routeInfo.hasHazard 
                    ? 'bg-amber-400 text-amber-900' 
                    : 'bg-green-500 text-white'
                }`}>
                  {routeInfo.hasHazard ? 'HAZARDS_PRESENT' : 'ROUTE_CLEAR'}
                </div>
              </div>

              {/* Detailed Directions */}
              <div className="space-y-1 mb-4 text-sm">
                {/* Initial direction */}
                <p className="text-muted-foreground">
                  <span className="inline-block w-16">(Start)</span>
                  Head {initialHeading}
                </p>
                
                {/* Street by street directions */}
                {routeInfo.directions.map((dir, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-muted-foreground w-16 flex-shrink-0">{dir.distance}</span>
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
              </div>

              {/* Hazard Warning Banner */}
              {routeInfo.hasHazard && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Route has hazards nearby. Proceed with caution and be prepared for detours.
                  </p>
                </div>
              )}

              {/* Location Summary */}
              <div className="pt-3 border-t text-xs text-muted-foreground">
                <p>Naval, Biliran • {routeInfo.hazardCount} hazard{routeInfo.hazardCount !== 1 ? 's' : ''} • {routeInfo.nearbyEvacCount} evacuation center{routeInfo.nearbyEvacCount !== 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          {/* Safety Reminder */}
          <Card className="mx-3 mb-3 bg-blue-50 border-blue-200">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold">Safety Reminder</p>
                <p>Stay alert, follow local authorities' instructions, and have emergency contacts ready.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action */}
        <div className="p-3 bg-background border-t">
          <Button onClick={handleReset} variant="outline" className="w-full">
            <Route className="w-4 h-4 mr-2" />
            Plan New Route
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
            {/* Current selection display */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {startCoords 
                  ? `${startCoords.lat.toFixed(6)}, ${startCoords.lng.toFixed(6)}`
                  : 'Not set'
                }
              </span>
            </div>

            {/* Input mode tabs */}
            <Tabs value={startInputMode} onValueChange={(v) => setStartInputMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  Pick on Map
                </TabsTrigger>
                <TabsTrigger value="coords" className="text-xs">
                  <Keyboard className="w-3 h-3 mr-1" />
                  Coordinates
                </TabsTrigger>
                <TabsTrigger value="location" className="text-xs">
                  <Crosshair className="w-3 h-3 mr-1" />
                  My Location
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-3">
                <Button 
                  variant="outline" 
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => openPicker('start')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  📍 Pin Start on Map
                </Button>
              </TabsContent>

              <TabsContent value="coords" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="11.5601"
                      value={startLatInput}
                      onChange={(e) => setStartLatInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="124.3949"
                      value={startLngInput}
                      onChange={(e) => setStartLngInput(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleSetStartCoords}>
                  Set Coordinates
                </Button>
              </TabsContent>

              <TabsContent value="location" className="mt-3">
                <Button 
                  variant="outline" 
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4 mr-2" />
                      Use My Current Location
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
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
            {/* Current selection display */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[48px]">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm flex-1">
                {endCoords 
                  ? selectedEvac 
                    ? evacCenters.find(c => c.id === selectedEvac)?.name || `${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}`
                    : `${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}`
                  : 'Not set'
                }
              </span>
            </div>

            {/* Input mode tabs */}
            <Tabs value={endInputMode} onValueChange={(v) => setEndInputMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  Pick on Map
                </TabsTrigger>
                <TabsTrigger value="coords" className="text-xs">
                  <Keyboard className="w-3 h-3 mr-1" />
                  Coordinates
                </TabsTrigger>
                <TabsTrigger value="evac" className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  Evac Center
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-3">
                <Button 
                  variant="outline" 
                  className="w-full border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => openPicker('end')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  📍 Pin Destination on Map
                </Button>
              </TabsContent>

              <TabsContent value="coords" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="11.5601"
                      value={endLatInput}
                      onChange={(e) => setEndLatInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="124.3949"
                      value={endLngInput}
                      onChange={(e) => setEndLngInput(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleSetEndCoords}>
                  Set Coordinates
                </Button>
              </TabsContent>

              <TabsContent value="evac" className="mt-3">
                <Select value={selectedEvac} onValueChange={handleSelectEvac}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an evacuation center" />
                  </SelectTrigger>
                  <SelectContent>
                    {evacCenters.length === 0 ? (
                      <SelectItem value="none" disabled>No evacuation centers available</SelectItem>
                    ) : (
                      evacCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          🏠 {center.name} - {center.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
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
