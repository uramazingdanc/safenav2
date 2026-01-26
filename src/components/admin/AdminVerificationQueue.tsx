import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Loader2,
  User,
  MapPin,
  Phone,
  Calendar,
  FileImage,
  Radio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  usePendingVerifications, 
  useVerificationImage, 
  useReviewVerification 
} from '@/hooks/useVerification';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SelectedUser {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  barangay: string | null;
  id_image_url: string | null;
  verification_submitted_at: string | null;
}

const AdminVerificationQueue = () => {
  const { data: pendingUsers, isLoading } = usePendingVerifications();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reviewVerification = useReviewVerification();
  const queryClient = useQueryClient();

  // Real-time subscription for verification updates
  useEffect(() => {
    const channel = supabase
      .channel('verification_queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'verification_status=eq.pending'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['verifications', 'pending'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      await reviewVerification.mutateAsync({
        userId: selectedUser.user_id,
        approved: true
      });
      toast.success(`${selectedUser.full_name} has been verified`);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to approve verification');
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    try {
      await reviewVerification.mutateAsync({
        userId: selectedUser.user_id,
        approved: false,
        adminNotes: rejectReason || 'ID verification failed'
      });
      toast.success(`Verification rejected for ${selectedUser.full_name}`);
      setSelectedUser(null);
      setRejectReason('');
      setShowRejectInput(false);
    } catch (error) {
      toast.error('Failed to reject verification');
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
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ocean" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-ocean" />
              Verification Requests
            </CardTitle>
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <Badge className="bg-amber-500/20 text-amber-400 border-0">
                {pendingUsers?.length || 0} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!pendingUsers?.length ? (
            <div className="p-8 text-center text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending verification requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400 hidden md:table-cell">Barangay</TableHead>
                  <TableHead className="text-slate-400 hidden lg:table-cell">Submitted</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-ocean/20 text-ocean text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-400">{user.phone_number || 'No phone'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 hidden md:table-cell">
                      {user.barangay || '-'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm hidden lg:table-cell">
                      {user.verification_submitted_at 
                        ? formatDistanceToNow(new Date(user.verification_submitted_at), { addSuffix: true })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-ocean text-ocean hover:bg-ocean hover:text-white"
                        onClick={() => setSelectedUser(user as SelectedUser)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => {
        setSelectedUser(null);
        setRejectReason('');
        setShowRejectInput(false);
      }}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-ocean" />
              Review Verification Request
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <VerificationReviewContent
              user={selectedUser}
              showRejectInput={showRejectInput}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              setShowRejectInput={setShowRejectInput}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={reviewVerification.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

interface VerificationReviewContentProps {
  user: SelectedUser;
  showRejectInput: boolean;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setShowRejectInput: (value: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

const VerificationReviewContent = ({
  user,
  showRejectInput,
  rejectReason,
  setRejectReason,
  setShowRejectInput,
  onApprove,
  onReject,
  isProcessing
}: VerificationReviewContentProps) => {
  const { data: imageUrl, isLoading: imageLoading } = useVerificationImage(user.id_image_url);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ID Image */}
      <div className="space-y-3">
        <Label className="text-slate-400">Submitted ID</Label>
        <div className="bg-slate-800 rounded-xl p-4 min-h-[300px] flex items-center justify-center">
          {imageLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-ocean" />
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Government ID" 
              className="max-w-full max-h-[400px] rounded-lg object-contain"
            />
          ) : (
            <div className="text-center text-slate-500">
              <FileImage className="w-12 h-12 mx-auto mb-2" />
              <p>No image available</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-ocean/20 text-ocean">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.full_name}</h3>
            <Badge className="bg-amber-500/20 text-amber-400 border-0">
              Pending Verification
            </Badge>
          </div>
        </div>

        <div className="space-y-3 bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300">{user.phone_number || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300">{user.barangay || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300">
              {user.verification_submitted_at 
                ? `Submitted ${formatDistanceToNow(new Date(user.verification_submitted_at), { addSuffix: true })}`
                : 'Unknown'}
            </span>
          </div>
        </div>

        {/* Reject Reason Input */}
        {showRejectInput && (
          <div className="space-y-2">
            <Label className="text-slate-400">Rejection Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {!showRejectInput ? (
            <>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectInput(true)}
                disabled={isProcessing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => setShowRejectInput(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVerificationQueue;
