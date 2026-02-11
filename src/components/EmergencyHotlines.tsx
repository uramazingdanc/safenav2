import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const EmergencyHotlines = () => {
  const { t } = useLanguage();

  const emergencyServices = [
    { name: 'MDRRMO', number: '0905-480-1477' },
    { name: 'NAVRU', number: '0916-285-9723' },
    { name: 'Naval Fire Station', number: '0968-024-3448' },
    { name: 'Naval Fire Station (Alt)', number: '0927-530-9667' },
    { name: 'BFP EMS Naval', number: '0950-861-7043' },
    { name: 'BFP EMS Naval (Alt)', number: '0906-608-8431' },
    { name: 'Naval Police Office', number: '0998-598-5765' },
    { name: 'Coast Guard Naval', number: '0917-632-3472' },
    { name: 'Biliran Provincial Hospital', number: '0920-934-1068' },
  ];

  const nationalHotlines = [
    { name: 'National Emergency Hotline', number: '911' },
    { name: 'NDRRMC', number: '02-8911-1406' },
    { name: 'PNP Hotline', number: '117' },
    { name: 'BFP Hotline', number: '02-8426-0219' },
    { name: 'Red Cross', number: '143' },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, "")}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-destructive text-destructive-foreground p-4 pb-6">
        <div className="flex items-center gap-3">
          <Phone className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">{t.emergencyHotlines}</h1>
            <p className="text-sm text-destructive-foreground/80">{t.quickAccessEmergency}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Emergency Services */}
        <Card className="border-border bg-card shadow-lg">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border bg-primary/5">
              <h2 className="text-lg font-semibold text-foreground">{t.emergencyServices}</h2>
            </div>
            <div className="divide-y divide-border">
              {emergencyServices.map((service) => (
                <div
                  key={service.name + service.number}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{service.name}</p>
                  </div>
                  <Button 
                    onClick={() => handleCall(service.number)}
                    className="gap-2 bg-destructive hover:bg-destructive/90"
                  >
                    <Phone className="w-4 h-4" />
                    {service.number}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* National Hotlines */}
        <Card className="border-border bg-card shadow-lg">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border bg-primary/5">
              <h2 className="text-lg font-semibold text-foreground">{t.nationalHotlines}</h2>
            </div>
            <div className="divide-y divide-border">
              {nationalHotlines.map((hotline) => (
                <div
                  key={hotline.name}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{hotline.name}</p>
                  </div>
                  <Button 
                    onClick={() => handleCall(hotline.number)}
                    className="gap-2 bg-destructive hover:bg-destructive/90"
                  >
                    <Phone className="w-4 h-4" />
                    {hotline.number}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyHotlines;
