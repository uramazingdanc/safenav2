import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEvacCenter, useUpdateEvacCenter } from '@/hooks/useRealtimeEvacuationCenters';
import { toast } from 'sonner';
import { NAVAL_BARANGAYS } from '@/constants/barangays';
import type { Tables } from '@/integrations/supabase/types';
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

type EvacuationCenter = Tables<'evacuation_centers'>;

interface EvacCenterModalProps {
  open: boolean;
  onClose: () => void;
  editCenter?: EvacuationCenter | null;
  initialCoords?: { lat: number; lng: number } | null;
}

const EvacCenterModal = ({ open, onClose, editCenter, initialCoords }: EvacCenterModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 100,
    status: 'standby' as 'open' | 'full' | 'standby' | 'closed',
    contact_number: '',
    amenities: [] as string[],
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const createCenter = useCreateEvacCenter();
  const updateCenter = useUpdateEvacCenter();

  // Initialize form when editing
  useEffect(() => {
    if (editCenter) {
      setFormData({
        name: editCenter.name,
        location: editCenter.location,
        capacity: editCenter.capacity,
        status: editCenter.status,
        contact_number: editCenter.contact_number || '',
        amenities: editCenter.amenities || [],
      });
      if (editCenter.latitude && editCenter.longitude) {
        setCoords({ lat: editCenter.latitude, lng: editCenter.longitude });
      }
    } else if (initialCoords) {
      setCoords(initialCoords);
    } else {
      setFormData({
        name: '',
        location: '',
        capacity: 100,
        status: 'standby',
        contact_number: '',
        amenities: [],
      });
      setCoords(null);
    }
  }, [editCenter, initialCoords, open]);

  // Initialize mini-map
  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: '#10b981' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
        }),
      }),
    });

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([
          coords?.lng || initialCoords?.lng || 124.3949,
          coords?.lat || initialCoords?.lat || 11.5601
        ]),
        zoom: 14,
      }),
    });

    map.on('click', (evt) => {
      const [lng, lat] = toLonLat(evt.coordinate);
      setCoords({ lat, lng });
    });

    mapInstanceRef.current = map;

    // Add initial marker if coords exist
    if (coords || initialCoords) {
      const c = coords || initialCoords!;
      const feature = new Feature({
        geometry: new Point(fromLonLat([c.lng, c.lat])),
      });
      markerSource.addFeature(feature);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  // Update marker when coords change
  useEffect(() => {
    if (!markerSourceRef.current || !coords) return;
    
    markerSourceRef.current.clear();
    const feature = new Feature({
      geometry: new Point(fromLonLat([coords.lng, coords.lat])),
    });
    markerSourceRef.current.addFeature(feature);
  }, [coords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const centerData = {
        name: formData.name,
        location: formData.location,
        capacity: formData.capacity,
        status: formData.status,
        contact_number: formData.contact_number || null,
        amenities: formData.amenities.length > 0 ? formData.amenities : null,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
      };

      if (editCenter) {
        await updateCenter.mutateAsync({ id: editCenter.id, ...centerData });
        toast.success('Evacuation center updated successfully');
      } else {
        await createCenter.mutateAsync(centerData);
        toast.success('Evacuation center created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving evacuation center:', error);
      toast.error('Failed to save evacuation center');
    }
  };

  const isLoading = createCenter.isPending || updateCenter.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-command border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            {editCenter ? 'Edit Evacuation Center' : 'Add Evacuation Center'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mini Map */}
          <div className="space-y-2">
            <Label className="text-slate-300">Location on Map (click to set)</Label>
            <div 
              ref={mapRef} 
              className="w-full h-48 rounded-lg border border-slate-600 overflow-hidden"
            />
            {coords && (
              <p className="text-xs text-slate-400">
                Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Center Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Barangay Hall Gymnasium"
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Barangay/Location *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {NAVAL_BARANGAYS.map((barangay) => (
                    <SelectItem key={barangay} value={barangay} className="text-white hover:bg-slate-700">
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Capacity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 100 })}
                className="bg-slate-800 border-slate-600 text-white"
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'open' | 'full' | 'standby' | 'closed') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="standby" className="text-white hover:bg-slate-700">Standby</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-slate-700">Open</SelectItem>
                  <SelectItem value="full" className="text-white hover:bg-slate-700">Full</SelectItem>
                  <SelectItem value="closed" className="text-white hover:bg-slate-700">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Contact Number</Label>
            <Input
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              placeholder="e.g., 0917-123-4567"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editCenter ? 'Update Center' : 'Create Center'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvacCenterModal;
