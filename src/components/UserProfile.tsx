import { useState } from 'react';
import { LogOut, Loader2, MapPin, Phone as PhoneIcon, Map, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import ProfileVerification from '@/components/ProfileVerification';

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
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get verification status from profile
  const verificationStatus = (profile as any)?.verification_status || 'unverified';
  const adminNotes = (profile as any)?.admin_notes;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-primary-foreground/80">Manage your account</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-primary">{profile?.full_name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
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

            {/* Contact Details */}
            <div className="mt-4 space-y-3">
              {profile?.phone_number && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="text-sm font-medium text-primary">{profile.phone_number}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Barangay</p>
                  <p className="text-sm font-medium text-primary">{profile?.barangay || 'Not set'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Section */}
        <ProfileVerification 
          verificationStatus={verificationStatus}
          adminNotes={adminNotes}
        />

        {/* Quick Links */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div
              className="flex items-center justify-center gap-2 p-4 cursor-pointer hover:bg-secondary/50 border-b border-border"
              onClick={() => navigate('/map')}
            >
              <Map className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">View Safety Map</span>
            </div>
            <div
              className="flex items-center justify-center gap-2 p-4 cursor-pointer hover:bg-secondary/50"
              onClick={() => navigate('/hotlines')}
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Emergency Hotlines</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
