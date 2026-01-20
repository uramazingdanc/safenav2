import { useState } from 'react';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Loader2, MapPin, Phone as PhoneIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfiles';
import { NAVAL_BARANGAYS } from '@/constants/barangays';
import { toast } from 'sonner';

const UserProfile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barangay, setBarangay] = useState('');

  const menuItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage alert preferences' },
    { icon: Shield, label: 'Privacy & Security', description: 'Account security settings' },
    { icon: Settings, label: 'App Settings', description: 'Customize your experience' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditOpen = () => {
    setFullName(profile?.full_name || '');
    setPhoneNumber(profile?.phone_number || '');
    setBarangay(profile?.barangay || '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        phone_number: phoneNumber || null,
        barangay: barangay || null,
      });
      toast.success('Profile updated successfully');
      setIsEditOpen(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.barangay && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Brgy. {profile.barangay}
                </p>
              )}
            </div>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleEditOpen}>
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g., 09123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Select value={barangay} onValueChange={setBarangay}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select your barangay" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {NAVAL_BARANGAYS.map((brgy) => (
                          <SelectItem key={brgy} value={brgy}>
                            {brgy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      {profile?.phone_number && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Contact Information</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{profile.phone_number}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        onClick={handleSignOut}
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
