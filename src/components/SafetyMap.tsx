import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Fix default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom marker icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userIcon = createIcon('#2563eb');
const hazardIcon = createIcon('#dc2626');
const evacIcon = createIcon('#16a34a');

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

// Component to recenter map
const RecenterMap = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 14);
    }
  }, [position, map]);
  return null;
};

const SafetyMap = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  // Default center (Cebu City, Philippines)
  const defaultCenter: [number, number] = [10.3157, 123.8854];

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
    const start = userLocation || defaultCenter;
    const end: [number, number] = [10.325, 123.905]; // Simulated destination

    // Create a simple route
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
      <div className="flex-1 mx-4 mb-4 rounded-xl overflow-hidden shadow-lg border min-h-[350px]">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '350px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RecenterMap position={userLocation} />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div className="text-center">
                  <strong>📍 Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Hazard Markers */}
          {hazards.map((hazard) => (
            <Marker key={hazard.id} position={[hazard.lat, hazard.lng]} icon={hazardIcon}>
              <Popup>
                <div className="text-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                  <strong className="text-red-600">{hazard.name}</strong>
                  <p className="text-xs capitalize">{hazard.type}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Evacuation Center Markers */}
          {evacCenters.map((center) => (
            <Marker key={center.id} position={[center.lat, center.lng]} icon={evacIcon}>
              <Popup>
                <div className="text-center">
                  <Building2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <strong className="text-green-600">{center.name}</strong>
                  <p className="text-xs">Evacuation Center</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route Polyline */}
          {route && (
            <Polyline
              positions={route}
              pathOptions={{ color: '#2563eb', weight: 4, dashArray: '10, 10' }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default SafetyMap;
