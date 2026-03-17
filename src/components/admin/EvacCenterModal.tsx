import { useState, useEffect } from "react";
import { MapPin, Loader2, Users, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEvacCenter, useUpdateEvacCenter } from "@/hooks/useRealtimeEvacuationCenters";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import MapLocationPicker from "@/components/MapLocationPicker";

type EvacuationCenter = Tables<"evacuation_centers">;

interface EvacCenterModalProps {
  open: boolean;
  onClose: () => void;
  editCenter?: EvacuationCenter | null;
  initialCoords?: { lat: number; lng: number } | null;
}

const EvacCenterModal = ({ open, onClose, editCenter, initialCoords }: EvacCenterModalProps) => {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [currentOccupancy, setCurrentOccupancy] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const createCenter = useCreateEvacCenter();
  const updateCenter = useUpdateEvacCenter();

  const parsedCapacity = Number(capacity);
  const parsedOccupancy = Number(currentOccupancy);

  const autoStatus: "open" | "full" = parsedCapacity > 0 && parsedOccupancy >= parsedCapacity ? "full" : "open";

  useEffect(() => {
    if (!open) return;

    if (editCenter) {
      setName(editCenter.name || "");
      setCapacity(editCenter.capacity ? String(editCenter.capacity) : "");
      setCurrentOccupancy(editCenter.current_occupancy ? String(editCenter.current_occupancy) : "");

      if (editCenter.latitude && editCenter.longitude) {
        setCoordinates({ lat: editCenter.latitude, lng: editCenter.longitude });
      } else {
        setCoordinates(null);
      }

      return;
    }

    if (initialCoords) {
      setCoordinates(initialCoords);
      setName("");
      setCapacity("");
      setCurrentOccupancy("");
      return;
    }

    setName("");
    setCapacity("");
    setCurrentOccupancy("");
    setCoordinates(null);
  }, [editCenter, initialCoords, open]);

  const resetForm = () => {
    setName("");
    setCapacity("");
    setCurrentOccupancy("");
    setCoordinates(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Please enter a center name");
      return;
    }

    if (!coordinates) {
      toast.error("Please select a location on the map");
      return;
    }

    if (capacity === "" || Number.isNaN(parsedCapacity) || parsedCapacity < 0) {
      toast.error("Please enter a valid capacity");
      return;
    }

    if (currentOccupancy === "" || Number.isNaN(parsedOccupancy) || parsedOccupancy < 0) {
      toast.error("Please enter a valid occupancy");
      return;
    }

    if (parsedOccupancy > parsedCapacity) {
      toast.error("Occupancy cannot exceed capacity");
      return;
    }

    try {
      const centerData = {
        name: trimmedName,
        location: trimmedName,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        capacity: parsedCapacity,
        current_occupancy: parsedOccupancy,
        status: autoStatus,
      };

      if (editCenter) {
        await updateCenter.mutateAsync({
          id: editCenter.id,
          ...centerData,
        });

        toast.success("Evacuation center updated successfully");
      } else {
        await createCenter.mutateAsync(centerData);
        toast.success("Evacuation center created successfully");
      }

      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save evacuation center");
    }
  };

  const isLoading = createCenter.isPending || updateCenter.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent className="w-[95vw] max-w-xl border-slate-700 bg-command p-0 text-white sm:rounded-2xl">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="shrink-0 border-b border-slate-700 px-4 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-left text-white">
              <MapPin className="h-5 w-5 text-emerald-400" />
              {editCenter ? "Edit Evacuation Center" : "Add Evacuation Center"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Center Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Agpangi Elementary School"
                  className="border-slate-600 bg-slate-800 text-base text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Total Capacity *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min="0"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g., 200"
                      className="border-slate-600 bg-slate-800 pl-10 text-base text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Current Occupants *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min="0"
                      value={currentOccupancy}
                      onChange={(e) => setCurrentOccupancy(e.target.value)}
                      placeholder="e.g., 75"
                      className="border-slate-600 bg-slate-800 pl-10 text-base text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Status (Automatic)</Label>
                <Input
                  value={autoStatus.toUpperCase()}
                  readOnly
                  className={`border-slate-600 bg-slate-800 text-base font-semibold text-white ${
                    autoStatus === "full" ? "text-rose-400" : "text-emerald-400"
                  }`}
                />
                <p className="text-xs text-slate-400">Status automatically updates based on occupancy and capacity.</p>
              </div>

              <MapLocationPicker
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                markerColor="#16a34a"
                label="Location *"
              />

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      {editCenter ? "Update Center" : "Add Center"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvacCenterModal;
