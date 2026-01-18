import { Phone, Shield, Flame, Stethoscope, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const EmergencyHotlines = () => {
  const { t } = useLanguage();

  const hotlines = [
    {
      name: 'National Emergency',
      number: '911',
      description: 'For all emergencies',
      icon: Phone,
      color: 'bg-destructive text-destructive-foreground',
    },
    {
      name: t.police,
      number: '117',
      description: 'Philippine National Police',
      icon: Shield,
      color: 'bg-primary text-primary-foreground',
    },
    {
      name: t.fire,
      number: '(02) 8426-0219',
      description: 'Bureau of Fire Protection',
      icon: Flame,
      color: 'bg-warning text-warning-foreground',
    },
    {
      name: t.medical,
      number: '(02) 8911-1111',
      description: 'Philippine Red Cross',
      icon: Stethoscope,
      color: 'bg-success text-success-foreground',
    },
    {
      name: t.disaster,
      number: '(02) 8911-5061',
      description: 'National Disaster Risk Reduction',
      icon: AlertTriangle,
      color: 'bg-accent text-accent-foreground',
    },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center animate-pulse-slow">
          <Phone className="w-6 h-6 text-destructive-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t.emergencyHotlines}</h1>
          <p className="text-sm text-muted-foreground">Tap to call immediately</p>
        </div>
      </div>

      {/* Emergency Alert */}
      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-destructive">
            ⚠️ In a life-threatening emergency, call 911 immediately.
          </p>
        </CardContent>
      </Card>

      {/* Hotlines List */}
      <div className="space-y-3">
        {hotlines.map((hotline) => (
          <Card
            key={hotline.number}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleCall(hotline.number)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 ${hotline.color} rounded-xl flex items-center justify-center`}>
                <hotline.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{hotline.name}</h3>
                <p className="text-sm text-muted-foreground">{hotline.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{hotline.number}</p>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0 h-auto">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Local Emergency Numbers</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            For local barangay emergency numbers, please check your local government's website
            or contact your barangay hall directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyHotlines;
