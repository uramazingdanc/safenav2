import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill, Stroke } from 'ol/style';

interface MapLocationPickerProps {
  coordinates: { lat: number; lng: number } | null;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  markerColor?: string;
  label?: string;
  compact?: boolean;
}

const MapLocationPicker = ({
  coordinates,
  onCoordinatesChange,
  markerColor = '#dc2626',
  label = 'Location',
  compact = false
}: MapLocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const [inputMode, setInputMode] = useState<'map' | 'manual'>('map');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const defaultCenter = { lat: 11.5601, lng: 124.3949 }; // Naval, Biliran

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!markerSourceRef.current) return;
    
    markerSourceRef.current.clear();
    const feature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
    });
    markerSourceRef.current.addFeature(feature);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: markerColor }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
        }),
      }),
    });

    const initialCenter = coordinates || defaultCenter;

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([initialCenter.lng, initialCenter.lat]),
        zoom: 14,
      }),
    });

    map.on('click', (evt) => {
      const [lng, lat] = toLonLat(evt.coordinate);
      onCoordinatesChange({ lat, lng });
      updateMarker(lat, lng);
    });

    mapInstanceRef.current = map;

    // Add initial marker if coordinates exist
    if (coordinates) {
      updateMarker(coordinates.lat, coordinates.lng);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (coordinates && markerSourceRef.current) {
      updateMarker(coordinates.lat, coordinates.lng);
      setManualLat(coordinates.lat.toFixed(6));
      setManualLng(coordinates.lng.toFixed(6));
    }
  }, [coordinates, updateMarker]);

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onCoordinatesChange({ lat, lng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.getView().animate({
          center: fromLonLat([lng, lat]),
          zoom: 14,
          duration: 500,
        });
      }
    }
  };

  const mapHeight = compact ? 'h-40' : 'h-48';

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'map' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Pick on Map
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Enter Coordinates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-2">
          <div 
            ref={mapRef} 
            className={`w-full ${mapHeight} rounded-lg overflow-hidden border`}
          />
          {coordinates && (
            <p className="text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 inline mr-1" />
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g., 11.5601"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g., 124.3949"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleManualSubmit}
            className="w-full"
          >
            <Navigation className="w-3 h-3 mr-1" />
            Set Location
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MapLocationPicker;
