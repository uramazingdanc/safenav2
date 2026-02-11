import { useState } from 'react';
import { LogOut, Loader2, MapPin, Phone as PhoneIcon, Map, Phone, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const isVerified = verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <h1 className="text-xl font-bold">{t.profileTitle}</h1>
        <p className="text-sm text-primary-foreground/80">{t.manageAccount}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card - Simplified, no circles */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-lg font-bold">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{profile?.full_name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleEditOpen}>
                    {t.edit}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t.editProfile}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t.fullName}</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.enterFullName}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.phoneNumber}</Label>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., 09123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barangay">{t.barangay}</Label>
                      <Select value={barangay} onValueChange={setBarangay}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder={t.selectBarangay} />
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
                      {t.cancel}
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {t.saveChanges}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 text-sm">
              {profile?.barangay && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Barangay {profile.barangay}</span>
                </div>
              )}
              {profile?.phone_number && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{profile.phone_number}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Status Section */}
        <ProfileVerification 
          verificationStatus={verificationStatus}
          adminNotes={adminNotes}
        />

        {/* Report Hazard Button - Only for verified users */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.reportAHazard}</h3>
                <p className="text-xs text-muted-foreground">
                  {isVerified 
                    ? t.reportHazardDesc
                    : t.mustBeVerified}
                </p>
              </div>
            </div>
            <Button 
              className="w-full mt-3" 
              variant={isVerified ? 'default' : 'outline'}
              onClick={() => isVerified && navigate('/report')}
              disabled={!isVerified}
            >
              {isVerified ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {t.reportHazard}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {t.getVerifiedFirst}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div
              className="flex items-center justify-center gap-2 p-4 cursor-pointer hover:bg-secondary/50 border-b border-border"
              onClick={() => navigate('/map')}
            >
              <Map className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t.viewSafetyMap}</span>
            </div>
            <div
              className="flex items-center justify-center gap-2 p-4 cursor-pointer hover:bg-secondary/50"
              onClick={() => navigate('/hotlines')}
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t.emergencyHotlines}</span>
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
          {t.signOutLabel}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
