import { Shield, MapPin, AlertTriangle, Phone, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const quickActions = [
    {
      title: t.findRoute,
      description: 'Get safe evacuation routes',
      icon: MapPin,
      color: 'bg-accent text-accent-foreground',
      path: '/map',
    },
    {
      title: t.reportHazard,
      description: 'Report a new hazard',
      icon: AlertTriangle,
      color: 'bg-warning text-warning-foreground',
      path: '/report',
    },
    {
      title: t.emergencyHotlines,
      description: 'Call for immediate help',
      icon: Phone,
      color: 'bg-destructive text-destructive-foreground',
      path: '/hotlines',
    },
  ];

  const recentAlerts = [
    { id: 1, title: 'Flash Flood Warning', location: 'Downtown Area', time: '2 hours ago', severity: 'high' },
    { id: 2, title: 'Road Closure', location: 'Main Street', time: '5 hours ago', severity: 'medium' },
    { id: 3, title: 'Power Outage', location: 'District 5', time: '1 day ago', severity: 'low' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.welcomeBack}</h1>
            <p className="text-primary-foreground/80 text-sm">Stay safe with SafeNav</p>
          </div>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-3">
          3 active alerts in your area. Check the map for safe routes.
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-4">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Alerts</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {recentAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`p-4 flex items-center gap-4 ${
                  index !== recentAlerts.length - 1 ? 'border-b' : ''
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    alert.severity === 'high'
                      ? 'bg-destructive'
                      : alert.severity === 'medium'
                      ? 'bg-warning'
                      : 'bg-muted-foreground'
                  }`}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {alert.location} • {alert.time}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Safety Tips */}
      <section>
        <Card className="bg-secondary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Safety Tip of the Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Always keep an emergency kit ready with water, food, flashlight, and first aid supplies.
              Know your nearest evacuation center and have multiple routes planned.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default UserDashboard;
