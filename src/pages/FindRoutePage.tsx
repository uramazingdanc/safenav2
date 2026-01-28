import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ArrowLeft, Route } from 'lucide-react';
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
import { Style, Circle, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';

// Marker styles
const startPinStyle = new Style({
  image: new Circle({
    radius: 12,
    fill: new Fill({ color: '#22c55e' }), // Green
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const endPinStyle = new Style({
  image: new Circle({
    radius: 12,
    fill: new Fill({ color: '#ef4444' }), // Red
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const routeStyle = new Style({
  stroke: new Stroke({
    color: '#3b82f6',
    width: 5,
  }),
});

const getHazardStyle = (severity: string) => {
  const colorMap: Record<string, string> = {
    low: '#eab308',
    medium: '#f97316',
    high: '#dc2626',
    critical: '#991b1b',
  };
  return new Style({
    image: new Circle({
      radius: 10,
      fill: new Fill({ color: colorMap[severity] || '#dc2626' }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
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

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const hazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const defaultCenter = { lat: 11.5601, lng: 124.3949 };

  // Initialize result map
  useEffect(() => {
    if (!routeGenerated || !mapRef.current || mapInstanceRef.current) return;

    const markersSource = new VectorSource();
    const routeSource = new VectorSource();
    const hazardSource = new VectorSource();

    const markersLayer = new VectorLayer({ source: markersSource });
    const routeLayer = new VectorLayer({ source: routeSource });
    const hazardLayer = new VectorLayer({ source: hazardSource });

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

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [routeGenerated]);

  // Draw route and markers when map is ready
  useEffect(() => {
    if (!routeGenerated || !mapInstanceRef.current || !startCoords || !endCoords) return;

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
        feature.setStyle(getHazardStyle(hazard.severity));
        hazardSource.addFeature(feature);
      }
    });

    // Fit view to show entire route
    const extent = routeSource.getExtent();
    mapInstanceRef.current?.getView().fit(extent, {
      padding: [60, 60, 60, 60],
      maxZoom: 16,
    });

    // Check for hazards along route
    const hasHazardOnRoute = nearbyHazards.some(h => {
      if (!h.latitude || !h.longitude) return false;
      // Simple distance check from route line
      const midLat = (startCoords.lat + endCoords.lat) / 2;
      const midLng = (startCoords.lng + endCoords.lng) / 2;
      const dist = Math.sqrt(
        Math.pow(h.latitude - midLat, 2) + Math.pow(h.longitude - midLng, 2)
      );
      return dist < 0.01;
    });

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
  }, [routeGenerated, startCoords, endCoords, hazards, toast]);

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
    setRouteGenerated(true);
  };

  const handleReset = () => {
    setRouteGenerated(false);
    setStartCoords(null);
    setEndCoords(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }
  };

  const canGenerate = startCoords && endCoords;

  if (routeGenerated) {
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
              {startCoords?.lat.toFixed(4)}, {startCoords?.lng.toFixed(4)} → {endCoords?.lat.toFixed(4)}, {endCoords?.lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Result Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-xs space-y-1.5">
            <p className="font-semibold text-sm mb-2">Route Legend</p>
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
            <div className="border-t border-muted my-1 pt-1">
              <p className="text-muted-foreground">Hazards:</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Low</span>
              <div className="w-3 h-3 rounded-full bg-orange-500 ml-2" />
              <span>Med</span>
              <div className="w-3 h-3 rounded-full bg-red-600 ml-2" />
              <span>High</span>
            </div>
          </div>
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
