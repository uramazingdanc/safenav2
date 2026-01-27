import { useState } from 'react';
import { AlertTriangle, Loader2, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateHazard } from '@/hooks/useHazards';
import { useToast } from '@/hooks/use-toast';
import { NAVAL_BARANGAYS } from '@/constants/barangays';
import MapLocationPicker from '@/components/MapLocationPicker';

interface HazardModalProps {
  open: boolean;
  onClose: () => void;
  initialCoords?: { lat: number; lng: number } | null;
}

const HAZARD_TYPES = [
  { value: 'flooding', label: 'Flooding', icon: '🌊' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'road_damage', label: 'Road Damage', icon: '🚧' },
  { value: 'road_obstruction', label: 'Road Obstruction', icon: '🚗' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-yellow-400' },
  { value: 'medium', label: 'Medium', color: 'text-orange-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
];

const HazardModal = ({ open, onClose, initialCoords }: HazardModalProps) => {
  const { toast } = useToast();
  const createHazard = useCreateHazard();

  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    barangay: '',
    description: '',
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialCoords || null
  );

  const handleClose = () => {
    setFormData({
      type: '',
      severity: '',
      barangay: '',
      description: '',
    });
    setCoordinates(null);
    onClose();
  };

  const handleSubmit = async (broadcast: boolean = false) => {
    if (!formData.type || !formData.severity || !formData.barangay) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!coordinates) {
      toast({
        title: 'Missing Location',
        description: 'Please select a location on the map or enter coordinates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createHazard.mutateAsync({
        type: formData.type,
        severity: formData.severity as 'low' | 'medium' | 'high' | 'critical',
        location: formData.barangay,
        description: formData.description,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
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
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Add New Hazard
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Location Picker */}
          <div className="space-y-2">
            <MapLocationPicker
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
              markerColor="#dc2626"
              label="Location *"
              compact
            />
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
            <Label className="text-slate-300">Barangay *</Label>
            <Select value={formData.barangay} onValueChange={(v) => setFormData(p => ({ ...p, barangay: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select barangay" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {NAVAL_BARANGAYS.map(brgy => (
                  <SelectItem key={brgy} value={brgy} className="text-white hover:bg-slate-700">
                    {brgy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description (Optional)</Label>
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
