import { Phone, Shield, Anchor, Stethoscope, AlertTriangle, ExternalLink, Building2, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';

const EmergencyHotlines = () => {
  const { t } = useLanguage();

  const nationalHotlines = [
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

  const localHotlines = [
    {
      name: 'Naval Police Office',
      numbers: ['(053) 500-9267', '0921-555-3961'],
      description: 'Local Police Station',
      icon: Shield,
      color: 'bg-primary text-primary-foreground',
    },
    {
      name: 'Philippine Coast Guard',
      numbers: ['(053) 507-0030', '0975-189-3951'],
      description: 'Maritime Emergency Response',
      icon: Anchor,
      color: 'bg-blue-600 text-white',
    },
    {
      name: 'Biliran Provincial Hospital',
      numbers: ['(053) 500-9096'],
      description: 'Medical Emergency',
      icon: Building2,
      color: 'bg-success text-success-foreground',
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

      {/* Local Naval, Biliran Hotlines */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Naval, Biliran Emergency Numbers
        </h2>
        {localHotlines.map((hotline) => (
          <Card
            key={hotline.name}
            className="hover:shadow-lg transition-all"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${hotline.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <hotline.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{hotline.name}</h3>
                  <p className="text-sm text-muted-foreground">{hotline.description}</p>
                  <div className="mt-2 space-y-1">
                    {hotline.numbers.map((number) => (
                      <Button
                        key={number}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => handleCall(number)}
                      >
                        <span className="font-medium">{number}</span>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* National Hotlines */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          National Emergency Numbers
        </h2>
        {nationalHotlines.map((hotline) => (
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
          <CardTitle className="text-base">Barangay Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            For barangay-level emergency assistance in Naval, Biliran, contact your local barangay hall directly.
            Naval has 26 barangays ready to assist during emergencies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyHotlines;
