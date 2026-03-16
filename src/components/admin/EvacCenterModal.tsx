import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateEvacCenter, useUpdateEvacCenter } from '@/hooks/useRealtimeEvacuationCenters';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import MapLocationPicker from '@/components/MapLocationPicker';

type EvacuationCenter = Tables<'evacuation_centers'>;

interface EvacCenterModalProps {
  open: boolean;
  onClose: () => void;
  editCenter?: EvacuationCenter | null;
  initialCoords?: { lat: number; lng: number } | null;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'standby', label: 'Standby' },
  { value: 'full', label: 'Full' },
  { value: 'closed', label: 'Closed' },
];

const EvacCenterModal = ({ open, onClose, editCenter, initialCoords }: EvacCenterModalProps) => {
  const [name, setName] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [capacity, setCapacity] = useState('100');
  const [currentOccupancy, setCurrentOccupancy] = useState('0');
  const [status, setStatus] = useState('open');

  const createCenter = useCreateEvacCenter();
  const updateCenter = useUpdateEvacCenter();

  useEffect(() => {
    if (editCenter) {
      setName(editCenter.name);
      setCapacity(editCenter.capacity.toString());
      setCurrentOccupancy(editCenter.current_occupancy.toString());
      setStatus(editCenter.status);
      if (editCenter.latitude && editCenter.longitude) {
        setCoordinates({ lat: editCenter.latitude, lng: editCenter.longitude });
      }
    } else if (initialCoords) {
      setCoordinates(initialCoords);
      setName('');
      setCapacity('100');
      setCurrentOccupancy('0');
      setStatus('open');
    } else {
      setName('');
      setCoordinates(null);
      setCapacity('100');
      setCurrentOccupancy('0');
      setStatus('open');
    }
  }, [editCenter, initialCoords, open]);

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && Number(val) <= 99999) {
      setCapacity(val);
    }
  };

  const handleOccupancyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && Number(val) <= 99999) {
      setCurrentOccupancy(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a center name');
      return;
    }

    if (!coordinates) {
      toast.error('Please select a location on the map or enter coordinates');
      return;
    }

    const cap = parseInt(capacity) || 100;
    const occ = parseInt(currentOccupancy) || 0;

    if (occ > cap) {
      toast.error('Occupancy cannot exceed capacity');
      return;
    }

    try {
      const centerData = {
        name: name.trim(),
        location: name.trim(),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        capacity: cap,
        status: status as 'open' | 'full' | 'standby' | 'closed',
        current_occupancy: occ,
      };

      if (editCenter) {
        await updateCenter.mutateAsync({ id: editCenter.id, ...centerData });
        toast.success('Evacuation center updated successfully');
      } else {
        await createCenter.mutateAsync(centerData);
        toast.success('Evacuation center created - Green marker added to map!');
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving evacuation center:', error);
      toast.error('Failed to save evacuation center');
    }
  };

  const handleClose = () => {
    setName('');
    setCoordinates(null);
    setCapacity('100');
    setCurrentOccupancy('0');
    setStatus('open');
    onClose();
  };

  const isLoading = createCenter.isPending || updateCenter.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-command border-slate-700 text-white max-w-xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            {editCenter ? 'Edit Evacuation Center' : 'Add Evacuation Center'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Center Name */}
            <div className="space-y-2">
              <Label className="text-slate-300">Center Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Agpangi Elementary School"
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-700">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity & Occupancy */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Capacity</Label>
                <Input
                  value={capacity}
                  onChange={handleCapacityChange}
                  placeholder="100"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Current Occupancy</Label>
                <Input
                  value={currentOccupancy}
                  onChange={handleOccupancyChange}
                  placeholder="0"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Location Picker */}
            <MapLocationPicker
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
              markerColor="#16a34a"
              label="Location *"
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    {editCenter ? 'Update Center' : 'Add Green Marker'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EvacCenterModal;