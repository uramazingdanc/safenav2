import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';

// Sample hazards data
const hazards = [
  { id: 1, lat: 10.315, lng: 123.885, name: 'Flood Zone', type: 'flood' },
  { id: 2, lat: 10.320, lng: 123.900, name: 'Landslide Risk', type: 'landslide' },
  { id: 3, lat: 10.308, lng: 123.892, name: 'Road Damage', type: 'infrastructure' },
];

// Sample evacuation centers
const evacCenters = [
  { id: 1, lat: 10.310, lng: 123.880, name: 'City Hall Evac Center' },
  { id: 2, lat: 10.325, lng: 123.895, name: 'School Gymnasium' },
];

// Marker styles
const userStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const hazardStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: '#dc2626' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const evacStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: '#16a34a' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const routeStyle = new Style({
  stroke: new Stroke({
    color: '#2563eb',
    width: 4,
    lineDash: [10, 10],
  }),
});

const SafetyMap = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const userLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Default center (Cebu City, Philippines) - [lng, lat] for OpenLayers
  const defaultCenter: [number, number] = [123.8854, 10.3157];

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create vector sources
    const hazardSource = new VectorSource();
    const evacSource = new VectorSource();
    const userSource = new VectorSource();
    const routeSource = new VectorSource();

    // Add hazard features
    hazards.forEach((hazard) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([hazard.lng, hazard.lat])),
        name: hazard.name,
        type: hazard.type,
        featureType: 'hazard',
      });
      feature.setStyle(hazardStyle);
      hazardSource.addFeature(feature);
    });

    // Add evacuation center features
    evacCenters.forEach((center) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([center.lng, center.lat])),
        name: center.name,
        featureType: 'evac',
      });
      feature.setStyle(evacStyle);
      evacSource.addFeature(feature);
    });

    // Create layers
    const hazardLayer = new VectorLayer({ source: hazardSource });
    const evacLayer = new VectorLayer({ source: evacSource });
    const userLayer = new VectorLayer({ source: userSource });
    const routeLayer = new VectorLayer({ source: routeSource });

    userLayerRef.current = userLayer;
    routeLayerRef.current = routeLayer;

    // Create popup overlay
    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: true,
    });
    overlayRef.current = overlay;

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        routeLayer,
        hazardLayer,
        evacLayer,
        userLayer,
      ],
      view: new View({
        center: fromLonLat(defaultCenter),
        zoom: 13,
      }),
      overlays: [overlay],
    });

    // Click handler for popups
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const coordinates = (feature.getGeometry() as Point).getCoordinates();
        const name = feature.get('name');
        const featureType = feature.get('featureType');
        const type = feature.get('type');

        if (popupRef.current) {
          let content = '';
          if (featureType === 'hazard') {
            content = `<div class="text-center p-2"><span class="text-lg">⚠️</span><br/><strong class="text-red-600">${name}</strong><p class="text-xs capitalize">${type}</p></div>`;
          } else if (featureType === 'evac') {
            content = `<div class="text-center p-2"><span class="text-lg">🏢</span><br/><strong class="text-green-600">${name}</strong><p class="text-xs">Evacuation Center</p></div>`;
          } else if (featureType === 'user') {
            content = `<div class="text-center p-2"><strong>📍 Your Location</strong></div>`;
          }
          popupRef.current.innerHTML = content;
          overlay.setPosition(coordinates);
        }
      } else {
        overlay.setPosition(undefined);
      }
    });

    // Change cursor on hover
    map.on('pointermove', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

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

  // Update route
  useEffect(() => {
    if (!routeLayerRef.current) return;

    const source = routeLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    if (route) {
      const coordinates = route.map(([lat, lng]) => fromLonLat([lng, lat]));
      const feature = new Feature({
        geometry: new LineString(coordinates),
      });
      feature.setStyle(routeStyle);
      source.addFeature(feature);
    }
  }, [route]);

  const handleUseLocation = () => {
    setIsLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setStartPoint(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsLoadingLocation(false);
          toast({
            title: t.success,
            description: 'Location detected successfully!',
          });
        },
        () => {
          setIsLoadingLocation(false);
          toast({
            title: t.error,
            description: 'Could not get your location. Please enable GPS.',
            variant: 'destructive',
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: t.error,
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRoute = () => {
    if (!startPoint || !destination) {
      toast({
        title: t.error,
        description: 'Please enter both starting point and destination.',
        variant: 'destructive',
      });
      return;
    }

    // Simulate route generation
    const start: [number, number] = userLocation || [10.3157, 123.8854];
    const end: [number, number] = [10.325, 123.905];

    const generatedRoute: [number, number][] = [
      start,
      [start[0] + 0.005, start[1] + 0.005],
      [start[0] + 0.008, start[1] + 0.012],
      end,
    ];

    setRoute(generatedRoute);

    // Check if route passes through hazard zones
    const hasHazardOnRoute = hazards.some((hazard) => {
      return generatedRoute.some((point) => {
        const distance = Math.sqrt(
          Math.pow(hazard.lat - point[0], 2) + Math.pow(hazard.lng - point[1], 2)
        );
        return distance < 0.01;
      });
    });

    if (hasHazardOnRoute) {
      toast({
        title: '⚠️ ' + t.hazardWarning,
        description: 'Consider an alternative route to avoid hazard zones.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✅ ' + t.safeRoute,
        description: 'Your route avoids known hazard zones.',
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Route Planning Card */}
      <Card className="m-4 shadow-lg animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            {t.findRoute}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="start" className="text-sm">{t.startingPoint}</Label>
            <div className="flex gap-2">
              <Input
                id="start"
                placeholder="Enter location or use GPS"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseLocation}
                disabled={isLoadingLocation}
                className="whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 mr-1" />
                {isLoadingLocation ? '...' : t.useMyLocation}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm">{t.destination}</Label>
            <Input
              id="destination"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <Button onClick={handleGenerateRoute} className="w-full">
            <Navigation className="w-4 h-4 mr-2" />
            {t.generateSafeRoute}
          </Button>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <div className="mx-4 mb-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>Hazards</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Evac Centers</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 mx-4 mb-4 rounded-xl overflow-hidden shadow-lg border min-h-[350px] relative">
        <div ref={mapRef} className="w-full h-full min-h-[350px]" />
        <div 
          ref={popupRef} 
          className="ol-popup bg-white rounded-lg shadow-lg border"
          style={{ position: 'absolute', minWidth: '120px' }}
        />
      </div>
    </div>
  );
};

export default SafetyMap;
