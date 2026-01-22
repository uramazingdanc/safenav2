import { MapPin, Navigation, Phone, HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfiles';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: profile } = useProfile();

  const quickActions = [
    {
      title: 'Safety Map',
      icon: MapPin,
      path: '/map',
      variant: 'primary' as const,
    },
    {
      title: 'Find Route',
      icon: Navigation,
      path: '/map',
      variant: 'outline' as const,
    },
    {
      title: 'Hotlines',
      icon: Phone,
      path: '/hotlines',
      variant: 'outline' as const,
    },
    {
      title: 'Help',
      icon: HelpCircle,
      path: '/help',
      variant: 'outline' as const,
    },
  ];

  const emergencyServices = [
    { name: 'MDRRMO', number: '0905-480-1477' },
    { name: 'NAVRU', number: '0916-285-9723' },
    { name: 'Naval Fire Station', number: '0968-024-3448' },
    { name: 'Naval Police Office', number: '0998-598-5765' },
  ];

  const nationalHotlines = [
    { name: 'National Emergency', number: '911' },
    { name: 'PNP Hotline', number: '117' },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, "")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <h1 className="text-xl font-bold">Welcome, {profile?.full_name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-sm text-primary-foreground/80">Stay informed about hazards and emergencies in your area</p>
      </div>

      <div className="p-4 space-y-6 -mt-2">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={action.path + index}
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              className={`h-auto py-4 flex flex-col items-center gap-2 ${
                action.variant === 'primary' 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground col-span-1' 
                  : 'bg-background border-border hover:bg-secondary'
              } ${index === 0 ? 'col-span-1' : ''}`}
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Your Barangay Section */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Your Barangay</p>
                <p className="font-semibold text-primary">{profile?.barangay || 'Not set'}</p>
              </div>
              <Button 
                variant="default" 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/map')}
              >
                View Map
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-primary">Emergency Contacts</h2>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 h-auto"
              onClick={() => navigate('/hotlines')}
            >
              View All
            </Button>
          </div>

          <Card className="border-border">
            <CardContent className="p-0">
              {/* Emergency Services */}
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-primary mb-2">Emergency Services</h3>
                <div className="space-y-1">
                  {emergencyServices.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-secondary/50 rounded px-2 -mx-2"
                      onClick={() => handleCall(service.number)}
                    >
                      <span className="text-sm text-primary font-medium">{service.name}</span>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        Call
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* National Hotlines */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-primary mb-2">National Hotlines</h3>
                <div className="space-y-1">
                  {nationalHotlines.map((hotline) => (
                    <div
                      key={hotline.name}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-secondary/50 rounded px-2 -mx-2"
                      onClick={() => handleCall(hotline.number)}
                    >
                      <span className="text-sm text-primary font-medium">{hotline.name}</span>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary">
                        <Phone className="w-3 h-3" />
                        {hotline.number}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
