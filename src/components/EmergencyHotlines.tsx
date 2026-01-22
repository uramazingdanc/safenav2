import { Phone, Shield, Anchor, Stethoscope, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const EmergencyHotlines = () => {
  const { t } = useLanguage();

  const hotlines = [
    {
      name: "National Emergency",
      number: "911",
      description: "For all emergencies",
      icon: Phone,
      color: "bg-destructive text-destructive-foreground",
    },
    {
      name: "Naval Police Office",
      landline: "(053) 500 9267",
      mobile: "0921-555-3961",
      icon: Shield,
      color: "bg-primary text-primary-foreground",
    },
    {
      name: "Philippine Coast Guard",
      landline: "(053) 507 0030",
      mobile: "0975-189-3951",
      icon: Anchor,
      color: "bg-blue-600 text-white",
    },
    {
      name: "Biliran Provincial Hospital",
      landline: "(053) 500 9096",
      mobile: null,
      icon: Stethoscope,
      color: "bg-success text-success-foreground",
    },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, "")}`;
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

      {/* 911 Emergency */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={() => handleCall("911")}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-destructive text-destructive-foreground rounded-xl flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">National Emergency</h3>
            <p className="text-sm text-muted-foreground">For all emergencies</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-destructive text-lg">911</p>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0 h-auto">
              <ExternalLink className="w-3 h-3 mr-1" />
              Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Local Hotlines with dual numbers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Local Emergency Numbers - Naval, Biliran
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {hotlines.slice(1).map((hotline) => (
              <div key={hotline.name} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${hotline.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <hotline.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{hotline.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div 
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -mx-1"
                        onClick={() => handleCall(hotline.landline)}
                      >
                        <span className="text-muted-foreground">Landline:</span>
                        <span className="font-medium text-primary">{hotline.landline}</span>
                      </div>
                      {hotline.mobile ? (
                        <div 
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -mx-1"
                          onClick={() => handleCall(hotline.mobile)}
                        >
                          <span className="text-muted-foreground">Mobile:</span>
                          <span className="font-medium text-primary">{hotline.mobile}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm p-1 -mx-1">
                          <span className="text-muted-foreground">Mobile:</span>
                          <span className="text-muted-foreground">N/A</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyHotlines;
