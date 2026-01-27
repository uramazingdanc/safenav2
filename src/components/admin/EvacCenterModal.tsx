import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const EvacCenterModal = ({ open, onClose, editCenter, initialCoords }: EvacCenterModalProps) => {
  const [name, setName] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const createCenter = useCreateEvacCenter();
  const updateCenter = useUpdateEvacCenter();

  // Initialize form when editing or opening
  useEffect(() => {
    if (editCenter) {
      setName(editCenter.name);
      if (editCenter.latitude && editCenter.longitude) {
        setCoordinates({ lat: editCenter.latitude, lng: editCenter.longitude });
      }
    } else if (initialCoords) {
      setCoordinates(initialCoords);
      setName('');
    } else {
      setName('');
      setCoordinates(null);
    }
  }, [editCenter, initialCoords, open]);

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

    try {
      const centerData = {
        name: name.trim(),
        location: name.trim(), // Use name as location for simplicity
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        // Default values for simplified form
        capacity: 100,
        status: 'open' as const,
        current_occupancy: 0,
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
    onClose();
  };

  const isLoading = createCenter.isPending || updateCenter.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-command border-slate-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            {editCenter ? 'Edit Evacuation Center' : 'Add Evacuation Center'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default EvacCenterModal;
