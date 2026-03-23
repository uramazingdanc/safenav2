import { useState, useRef } from 'react';
import { AlertTriangle, Upload, Send, Loader2, X, ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useCreateHazardReport } from '@/hooks/useHazardReports';
import { NAVAL_BARANGAYS } from '@/constants/barangays';
import MapPickerModal from '@/components/MapPickerModal';
import { useProfile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';

const ReportHazard = () => {
  const navigate = useNavigate();
  const [hazardType, setHazardType] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [locationMode, setLocationMode] = useState<'map' | 'coords'>('map');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { t } = useLanguage();
  const { toast } = useToast();
  const createReport = useCreateHazardReport();
  const { data: profile } = useProfile();
  
  const isVerified = profile?.verification_status === 'verified';

  const HAZARD_TYPES = [
    { value: 'flooding', label: t.flooding, icon: '🌊' },
    { value: 'landslide', label: t.landslide, icon: '⛰️' },
    { value: 'road_damage', label: t.roadDamage, icon: '🚧' },
    { value: 'road_obstruction', label: t.roadObstruction, icon: '🚗' },
    { value: 'other', label: t.other, icon: '⚠️' },
  ];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: t.error, description: t.selectImageFile, variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t.error, description: t.imageSizeLimit, variant: 'destructive' });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setCoordinates({ lat, lng });
      toast({ title: '✅ Location Set' });
    } else {
      toast({ title: t.error, variant: 'destructive' });
    }
  };

  const handlePickerConfirm = (coords: { lat: number; lng: number }) => {
    setCoordinates(coords);
    setLatInput(coords.lat.toFixed(6));
    setLngInput(coords.lng.toFixed(6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hazardType || !barangay) {
      toast({ title: t.error, description: `${t.selectHazardType} / ${t.selectBarangayLabel}`, variant: 'destructive' });
      return;
    }

    if (!isVerified) {
      toast({ title: t.error, description: t.onlyVerifiedUpload, variant: 'destructive' });
      return;
    }

    if (!photoFile) {
      toast({ title: t.error, description: t.photoEvidence, variant: 'destructive' });
      return;
    }

    if (!coordinates) {
      toast({ title: t.error, description: t.exactLocation, variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_hazard.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('hazard_photos')
        .upload(fileName, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('hazard_photos')
        .getPublicUrl(fileName);

      await createReport.mutateAsync({
        hazard_type: hazardType,
        description,
        location: barangay,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        photo_url: urlData.publicUrl,
      });

      toast({ title: t.success, description: t.submitReport });
      navigate(-1);
    } catch (error) {
      console.error('Submit error:', error);
      toast({ title: t.error, description: t.submissionFailed, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-destructive text-destructive-foreground p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-destructive-foreground hover:bg-destructive-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t.reportHazard}</h1>
          <p className="text-sm text-destructive-foreground/80">{t.helpCommunity}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {t.reportDetails}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.hazardType} *</Label>
                <Select value={hazardType} onValueChange={setHazardType} disabled={createReport.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectHazardType} />
                  </SelectTrigger>
                  <SelectContent>
                    {HAZARD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.barangay} *</Label>
                <Select value={barangay} onValueChange={setBarangay} disabled={createReport.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectBarangayLabel} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {NAVAL_BARANGAYS.map((brgy) => (
                      <SelectItem key={brgy} value={brgy}>{brgy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.exactLocation} *</Label>
                <Tabs value={locationMode} onValueChange={(v) => setLocationMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="map" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{t.pickOnMap}</TabsTrigger>
                    <TabsTrigger value="coords" className="text-xs">{t.coordinates}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="map" className="mt-3">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setIsPickerOpen(true)}>
                      <MapPin className="w-4 h-4 mr-2" />{t.pickLocationMap}
                    </Button>
                  </TabsContent>

                  <TabsContent value="coords" className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">{t.latitude}</Label><Input type="number" step="any" placeholder="11.5601" value={latInput} onChange={(e) => setLatInput(e.target.value)} /></div>
                      <div><Label className="text-xs">{t.longitude}</Label><Input type="number" step="any" placeholder="124.3949" value={lngInput} onChange={(e) => setLngInput(e.target.value)} /></div>
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={handleSetCoords}>{t.setCoordinates}</Button>
                  </TabsContent>
                </Tabs>

                {coordinates && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.description} ({t.optional})</Label>
                <Textarea placeholder={t.describeHazard} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={createReport.isPending} />
              </div>

              <div className="space-y-2">
                <Label>{t.photoEvidence} *</Label>
                {!isVerified ? (
                  <div className="border-2 border-dashed border-destructive/30 rounded-lg p-6 text-center bg-destructive/5">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm font-medium text-destructive">{t.verificationRequired}</p>
                    <p className="text-xs text-muted-foreground">{t.onlyVerifiedUpload}</p>
                  </div>
                ) : (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    <input id="camera-input-hazard" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
                    
                    {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Evidence" className="w-full h-48 object-cover rounded-lg border" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleRemovePhoto}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">{t.upload}</p>
                          <p className="text-xs text-muted-foreground">{t.fromGallery}</p>
                        </div>
                        <div className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => document.getElementById('camera-input-hazard')?.click()}>
                          <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">{t.takePhoto}</p>
                          <p className="text-xs text-muted-foreground">{t.openCamera}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={createReport.isPending}>
                {createReport.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.submitting}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />{t.submitReport}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <MapPickerModal open={isPickerOpen} onOpenChange={setIsPickerOpen} onConfirm={handlePickerConfirm} mode="end" initialCoords={coordinates} />
    </div>
  );
};

export default ReportHazard;
