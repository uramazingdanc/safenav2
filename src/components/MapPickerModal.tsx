import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// OpenLayers imports
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import 'ol/ol.css';

interface MapPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (coords: { lat: number; lng: number }) => void;
  mode: 'start' | 'end';
  initialCoords?: { lat: number; lng: number } | null;
}

const MapPickerModal = ({
  open,
  onOpenChange,
  onConfirm,
  mode,
  initialCoords,
}: MapPickerModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords?.lat || 11.5601,
    lng: initialCoords?.lng || 124.3949,
  });

  const defaultCenter = { lat: 11.5601, lng: 124.3949 }; // Naval, Biliran

  // Initialize map when modal opens
  useEffect(() => {
    if (!open || !mapRef.current) return;

    // Small delay to ensure container is rendered
    const initTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.updateSize();
        return;
      }

      const initialCenter = initialCoords || defaultCenter;

      const map = new OLMap({
        target: mapRef.current!,
        layers: [
          new TileLayer({ source: new OSM() }),
        ],
        view: new View({
          center: fromLonLat([initialCenter.lng, initialCenter.lat]),
          zoom: 15,
        }),
      });

      // Update coordinates when map moves
      map.on('moveend', () => {
        const view = map.getView();
        const center = view.getCenter();
        if (center) {
          const [lng, lat] = toLonLat(center);
          setCenterCoords({ lat, lng });
        }
      });

      mapInstanceRef.current = map;
    }, 100);

    return () => {
      clearTimeout(initTimer);
    };
  }, [open, initialCoords]);

  // Cleanup map on close
  useEffect(() => {
    if (!open && mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm(centerCoords);
    onOpenChange(false);
  }, [centerCoords, onConfirm, onOpenChange]);

  const pinColor = mode === 'start' ? 'text-green-500' : 'text-red-500';
  const pinBgColor = mode === 'start' ? 'bg-green-500' : 'bg-red-500';
  const modeLabel = mode === 'start' ? 'Start' : 'Destination';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[90vh] p-0 gap-0 sm:max-w-[95vw]">
        <DialogHeader className="p-4 pb-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className={`w-5 h-5 ${pinColor}`} />
            Set {modeLabel} Location
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Drag the map to position the pin at your desired {modeLabel.toLowerCase()} location
          </p>
        </DialogHeader>

        {/* Map Container */}
        <div className="relative flex-1 h-full min-h-[400px]">
          <div ref={mapRef} className="w-full h-full" />

          {/* Fixed Center Pin (Crosshair) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
            <div className="flex flex-col items-center">
              <MapPin className={`w-10 h-10 ${pinColor} drop-shadow-lg`} fill={mode === 'start' ? '#22c55e' : '#ef4444'} />
            </div>
          </div>

          {/* Coordinates Display */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border z-10">
            <p className="text-xs text-muted-foreground text-center">Selected Coordinates</p>
            <p className="text-sm font-mono font-medium text-center">
              {centerCoords.lat.toFixed(6)}, {centerCoords.lng.toFixed(6)}
            </p>
          </div>

          {/* Confirm Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <Button
              onClick={handleConfirm}
              size="lg"
              className={`${mode === 'start' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white shadow-lg px-8`}
            >
              <Check className="w-5 h-5 mr-2" />
              Confirm {modeLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPickerModal;
