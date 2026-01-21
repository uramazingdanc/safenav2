import { useState, useRef, useEffect } from 'react';
import { X, MapPin, AlertTriangle, Loader2, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateHazard } from '@/hooks/useHazards';
import { useToast } from '@/hooks/use-toast';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill, Stroke } from 'ol/style';

interface HazardModalProps {
  open: boolean;
  onClose: () => void;
  initialCoords?: { lat: number; lng: number } | null;
}

const HAZARD_TYPES = [
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'accident', label: 'Road Accident', icon: '🚗' },
  { value: 'storm', label: 'Storm/Typhoon', icon: '🌀' },
  { value: 'earthquake', label: 'Earthquake', icon: '📳' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'text-rose-400' },
];

const HazardModal = ({ open, onClose, initialCoords }: HazardModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const { toast } = useToast();
  const createHazard = useCreateHazard();

  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    location: '',
    description: '',
    latitude: initialCoords?.lat || 11.5601,
    longitude: initialCoords?.lng || 124.3949,
  });

  // Initialize map
  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: '#e11d48' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([formData.longitude, formData.latitude]),
        zoom: 14,
      }),
    });

    // Add initial marker
    const marker = new Feature({
      geometry: new Point(fromLonLat([formData.longitude, formData.latitude])),
    });
    markerSource.addFeature(marker);

    // Click to place marker
    map.on('click', (evt) => {
      const coords = toLonLat(evt.coordinate);
      setFormData(prev => ({
        ...prev,
        longitude: coords[0],
        latitude: coords[1],
      }));

      markerSource.clear();
      const newMarker = new Feature({
        geometry: new Point(evt.coordinate),
      });
      markerSource.addFeature(newMarker);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  // Update marker when initialCoords change
  useEffect(() => {
    if (initialCoords && markerSourceRef.current && mapInstanceRef.current) {
      setFormData(prev => ({
        ...prev,
        latitude: initialCoords.lat,
        longitude: initialCoords.lng,
      }));

      markerSourceRef.current.clear();
      const marker = new Feature({
        geometry: new Point(fromLonLat([initialCoords.lng, initialCoords.lat])),
      });
      markerSourceRef.current.addFeature(marker);

      mapInstanceRef.current.getView().setCenter(fromLonLat([initialCoords.lng, initialCoords.lat]));
    }
  }, [initialCoords]);

  const handleClose = () => {
    setFormData({
      type: '',
      severity: '',
      location: '',
      description: '',
      latitude: 11.5601,
      longitude: 124.3949,
    });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }
    onClose();
  };

  const handleSubmit = async (broadcast: boolean = false) => {
    if (!formData.type || !formData.severity || !formData.location) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createHazard.mutateAsync({
        type: formData.type,
        severity: formData.severity as 'low' | 'medium' | 'high' | 'critical',
        location: formData.location,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: 'active',
      });

      toast({
        title: broadcast ? 'Alert Broadcasted!' : 'Hazard Created',
        description: broadcast 
          ? 'Emergency alert sent to all users in the affected area.'
          : 'Hazard has been added to the map.',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hazard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Add New Hazard
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Mini Map */}
          <div className="space-y-2">
            <Label className="text-slate-300">Click Map to Set Location</Label>
            <div 
              ref={mapRef} 
              className="w-full h-48 rounded-lg overflow-hidden border border-slate-700"
            />
            <p className="text-xs text-slate-500">
              <MapPin className="w-3 h-3 inline mr-1" />
              {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Hazard Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {HAZARD_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white hover:bg-slate-700">
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Severity Level *</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData(p => ({ ...p, severity: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {SEVERITY_LEVELS.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white hover:bg-slate-700">
                      <span className={s.color}>● </span>{s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Location Description *</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g., Near Brgy. Hall, Caraycaray"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Additional details about the hazard..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleSubmit(false)}
              disabled={createHazard.isPending}
            >
              {createHazard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Hazard
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => handleSubmit(true)}
              disabled={createHazard.isPending}
            >
              <Radio className="w-4 h-4 mr-2" />
              Broadcast Alert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HazardModal;
