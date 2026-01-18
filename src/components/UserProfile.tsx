import { User, Settings, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';

const UserProfile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage alert preferences' },
    { icon: Shield, label: 'Privacy & Security', description: 'Account security settings' },
    { icon: Settings, label: 'App Settings', description: 'Customize your experience' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Juan Dela Cruz</h2>
              <p className="text-sm text-muted-foreground">juan@email.com</p>
              <p className="text-xs text-muted-foreground mt-1">Member since 2024</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Emergency Contact</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maria Dela Cruz</p>
              <p className="text-sm text-muted-foreground">+63 912 345 6789</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Menu */}
      <Card>
        <CardContent className="p-0">
          {menuItems.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Settings */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive emergency alerts</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Location Services</p>
              <p className="text-sm text-muted-foreground">Allow GPS access</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => navigate('/')}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        SafeNav v1.0.0
      </p>
    </div>
  );
};

export default UserProfile;
