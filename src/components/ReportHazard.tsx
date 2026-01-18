import { useState } from 'react';
import { AlertTriangle, Camera, MapPin, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const ReportHazard = () => {
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  const hazardTypes = [
    { value: 'flood', label: 'Flood / Rising Water' },
    { value: 'landslide', label: 'Landslide / Soil Erosion' },
    { value: 'fire', label: 'Fire / Smoke' },
    { value: 'road', label: 'Road Damage / Obstruction' },
    { value: 'structure', label: 'Building Damage' },
    { value: 'power', label: 'Downed Power Lines' },
    { value: 'other', label: 'Other Hazard' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t.success,
      description: 'Hazard report submitted successfully. Thank you for helping keep our community safe!',
    });
    setHazardType('');
    setDescription('');
    setLocation('');
  };

  const handleUseLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: t.success,
            description: 'Location detected!',
          });
        },
        () => {
          toast({
            title: t.error,
            description: 'Could not get location.',
            variant: 'destructive',
          });
        }
      );
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
            <div className="space-y-2">
              <Label>{t.hazardType}</Label>
              <Select value={hazardType} onValueChange={setHazardType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hazard type" />
                </SelectTrigger>
                <SelectContent>
                  {hazardTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter location or address"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleUseLocation}>
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.description}</Label>
              <Textarea
                placeholder="Describe the hazard in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors">
                <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to add photo</p>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Send className="w-4 h-4 mr-2" />
              {t.submit} Report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportHazard;
