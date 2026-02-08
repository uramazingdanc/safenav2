import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Check } from 'lucide-react';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords?.lat || 11.5601,
    lng: initialCoords?.lng || 124.3949,
  });
  const [mapReady, setMapReady] = useState(false);

  const defaultCenter = { lat: 11.5601, lng: 124.3949 }; // Naval, Biliran

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCenterCoords({
        lat: initialCoords?.lat || 11.5601,
        lng: initialCoords?.lng || 124.3949,
      });
      setMapReady(false);
    }
  }, [open, initialCoords]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!open) {
      // Cleanup when closing
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
      return;
    }

    // Wait for dialog animation to complete
    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      
      // Cleanup any existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }

      const container = mapContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Only initialize if container has dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Map container has no dimensions, retrying...');
        return;
      }

      const initialCenter = initialCoords || defaultCenter;

      const map = new OLMap({
        target: container,
        layers: [
          new TileLayer({ 
            source: new OSM(),
            preload: 4,
          }),
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
      setMapReady(true);

      // Force resize multiple times to ensure tiles load
      const resizeMap = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize();
        }
      };
      
      resizeMap();
      setTimeout(resizeMap, 100);
      setTimeout(resizeMap, 300);
      setTimeout(resizeMap, 500);
    }, 350); // Wait for dialog open animation

    return () => {
      clearTimeout(initTimer);
    };
  }, [open, initialCoords]);

  // Handle resize events
  useEffect(() => {
    if (!open || !mapInstanceRef.current) return;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.updateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, mapReady]);

  const handleConfirm = useCallback(() => {
    onConfirm(centerCoords);
    onOpenChange(false);
  }, [centerCoords, onConfirm, onOpenChange]);

  const pinColor = mode === 'start' ? 'text-green-500' : 'text-red-500';
  const modeLabel = mode === 'start' ? 'Start' : 'Destination';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] h-[80vh] p-0 gap-0 flex flex-col overflow-hidden">
        <div className="p-4 pb-2 border-b bg-background shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MapPin className={`w-5 h-5 ${pinColor}`} />
              Set {modeLabel} Location
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Drag the map to position the pin at your desired {modeLabel.toLowerCase()} location
          </p>
        </div>

        {/* Map Container - Fixed height approach */}
        <div className="relative flex-1 bg-muted">
          {/* Actual map container with explicit dimensions */}
          <div 
            ref={mapContainerRef} 
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Loading indicator */}
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-5">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading map...</span>
              </div>
            </div>
          )}

          {/* Fixed Center Pin (Crosshair) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
            <MapPin 
              className={`w-10 h-10 ${pinColor} drop-shadow-lg`} 
              fill={mode === 'start' ? '#22c55e' : '#ef4444'} 
            />
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
