import { User, Phone, MapPin, Calendar, Shield, CheckCircle, XCircle, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { useVerificationImages } from '@/hooks/useVerification';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  barangay: string | null;
  phone_number: string | null;
  is_verified: boolean;
  verification_status: string | null;
  avatar_url: string | null;
  id_image_url: string | null;
  selfie_image_url: string | null;
  created_at: string;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  role?: string;
}

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

const UserProfileModal = ({ open, onClose, user }: UserProfileModalProps) => {
  const { data: images } = useVerificationImages(
    user?.id_image_url || null,
    user?.selfie_image_url || null
  );

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin': 
        return <Badge className="bg-rose-500/20 text-rose-400 border-0">Admin</Badge>;
      case 'moderator': 
        return <Badge className="bg-amber-500/20 text-amber-400 border-0">Moderator</Badge>;
      default: 
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">User</Badge>;
    }
  };

  const getVerificationBadge = () => {
    if (user.is_verified) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    if (user.verification_status === 'pending') {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-0">
          <Shield className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    
    if (user.verification_status === 'rejected') {
      return (
        <Badge className="bg-rose-500/20 text-rose-400 border-0">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-0">
        Unverified
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-command border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-ocean" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-ocean/20 text-ocean text-lg">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{user.full_name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getRoleBadge(user.role)}
                {getVerificationBadge()}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{user.barangay || 'No barangay set'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{user.phone_number || 'No phone number'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification Images */}
          {(user.id_image_url || user.selfie_image_url) && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Verification Documents
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {images?.idUrl ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">ID Document</p>
                      <img 
                        src={images.idUrl} 
                        alt="ID Document" 
                        className="w-full h-32 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  ) : user.id_image_url && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">ID Document</p>
                      <div className="w-full h-32 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-center">
                        <span className="text-xs text-slate-500">Loading...</span>
                      </div>
                    </div>
                  )}
                  
                  {images?.selfieUrl ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Selfie</p>
                      <img 
                        src={images.selfieUrl} 
                        alt="Selfie" 
                        className="w-full h-32 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  ) : user.selfie_image_url && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Selfie</p>
                      <div className="w-full h-32 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-center">
                        <span className="text-xs text-slate-500">Loading...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {user.verification_submitted_at && (
                  <p className="text-xs text-slate-500">
                    Submitted: {format(new Date(user.verification_submitted_at), 'PPP p')}
                  </p>
                )}
                {user.verification_reviewed_at && (
                  <p className="text-xs text-slate-500">
                    Reviewed: {format(new Date(user.verification_reviewed_at), 'PPP p')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
