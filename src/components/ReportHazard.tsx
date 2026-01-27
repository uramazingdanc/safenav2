import { useState, useRef } from 'react';
import { AlertTriangle, Camera, Send, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useCreateHazardReport } from '@/hooks/useHazardReports';
import { NAVAL_BARANGAYS } from '@/constants/barangays';
import MapLocationPicker from '@/components/MapLocationPicker';

const HAZARD_TYPES = [
  { value: 'flooding', label: 'Flooding' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'road_obstruction', label: 'Road Obstruction' },
];

const ReportHazard = () => {
  const [hazardType, setHazardType] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { t } = useLanguage();
  const { toast } = useToast();
  const createReport = useCreateHazardReport();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t.error,
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t.error,
          description: 'Image must be less than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hazardType || !barangay) {
      toast({
        title: t.error,
        description: 'Please select hazard type and barangay.',
        variant: 'destructive',
      });
      return;
    }

    if (!photoFile) {
      toast({
        title: t.error,
        description: 'Please take or upload a photo as evidence.',
        variant: 'destructive',
      });
      return;
    }

    if (!coordinates) {
      toast({
        title: t.error,
        description: 'Please select the location on the map or enter coordinates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createReport.mutateAsync({
        hazard_type: hazardType,
        description,
        location: barangay,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });

      toast({
        title: t.success,
        description: 'Hazard report submitted successfully. It will be reviewed by administrators.',
      });
      
      // Reset form
      setHazardType('');
      setBarangay('');
      setDescription('');
      setCoordinates(null);
      handleRemovePhoto();
    } catch (error) {
      toast({
        title: t.error,
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-warning rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-warning-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t.reportHazard}</h1>
          <p className="text-sm text-muted-foreground">Help keep your community safe</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hazard Type */}
            <div className="space-y-2">
              <Label>{t.hazardType} *</Label>
              <Select value={hazardType} onValueChange={setHazardType} disabled={createReport.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hazard type" />
                </SelectTrigger>
                <SelectContent>
                  {HAZARD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barangay */}
            <div className="space-y-2">
              <Label>Barangay *</Label>
              <Select value={barangay} onValueChange={setBarangay} disabled={createReport.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  {NAVAL_BARANGAYS.map((brgy) => (
                    <SelectItem key={brgy} value={brgy}>
                      {brgy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Picker */}
            <MapLocationPicker
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
              markerColor="#dc2626"
              label="Exact Location *"
              compact
            />

            {/* Description */}
            <div className="space-y-2">
              <Label>{t.description} (Optional)</Label>
              <Textarea
                placeholder="Describe the hazard in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={createReport.isPending}
              />
            </div>

            {/* Photo Evidence */}
            <div className="space-y-2">
              <Label>Photo Evidence *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Evidence" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemovePhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Take Photo</p>
                  <p className="text-xs text-muted-foreground">Tap to capture or upload evidence</p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={createReport.isPending}>
              {createReport.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t.submit} Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportHazard;
