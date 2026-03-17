import { useState, useEffect } from "react";
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
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePendingVerifications, useVerificationImages, useReviewVerification } from "@/hooks/useVerification";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SelectedUser {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  barangay: string | null;
  id_image_url: string | null;
  selfie_image_url: string | null;
  verification_submitted_at: string | null;
}

const AdminVerificationQueue = () => {
  const { data: pendingUsers, isLoading } = usePendingVerifications();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reviewVerification = useReviewVerification();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("verification_queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "verification_status=eq.pending",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["verifications", "pending"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const resetDialogState = () => {
    setSelectedUser(null);
    setRejectReason("");
    setShowRejectInput(false);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    try {
      await reviewVerification.mutateAsync({
        userId: selectedUser.user_id,
        approved: true,
      });

      toast.success(`${selectedUser.full_name} has been verified`);
      resetDialogState();
    } catch (error) {
      toast.error("Failed to approve verification");
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    try {
      await reviewVerification.mutateAsync({
        userId: selectedUser.user_id,
        approved: false,
        adminNotes: rejectReason || "ID verification failed",
      });

      toast.success(`Verification rejected for ${selectedUser.full_name}`);
      resetDialogState();
    } catch (error) {
      toast.error("Failed to reject verification");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-ocean" />
              Verification Requests
            </CardTitle>

            <div className="flex items-center gap-2">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
              <Badge className="border-0 bg-amber-500/20 text-amber-400">{pendingUsers?.length || 0} Pending</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!pendingUsers?.length ? (
            <div className="p-8 text-center text-slate-400">
              <Shield className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No pending verification requests</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="hidden text-slate-400 md:table-cell">Barangay</TableHead>
                    <TableHead className="hidden text-slate-400 lg:table-cell">Submitted</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-ocean/20 text-xs text-ocean">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-medium text-white">{user.full_name}</p>
                            <p className="text-xs text-slate-400">{user.phone_number || "No phone"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden text-slate-300 md:table-cell">{user.barangay || "-"}</TableCell>

                      <TableCell className="hidden text-sm text-slate-400 lg:table-cell">
                        {user.verification_submitted_at
                          ? formatDistanceToNow(new Date(user.verification_submitted_at), { addSuffix: true })
                          : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-ocean text-ocean hover:bg-ocean hover:text-white"
                          onClick={() => {
                            setSelectedUser(user as SelectedUser);
                            setRejectReason("");
                            setShowRejectInput(false);
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            resetDialogState();
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl border-slate-700 bg-slate-900 p-0 text-white sm:rounded-2xl">
          {selectedUser && (
            <div className="flex max-h-[90vh] flex-col">
              <DialogHeader className="shrink-0 border-b border-slate-700 px-4 py-4 sm:px-6">
                <DialogTitle className="text-left text-lg font-bold text-white sm:text-xl">
                  Review Verification Request
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
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
              </div>
            </div>
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
  isProcessing,
}: VerificationReviewContentProps) => {
  const { data: images, isLoading: imagesLoading } = useVerificationImages(user.id_image_url, user.selfie_image_url);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-700 pb-4 sm:flex-row sm:items-center">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-ocean/20 text-ocean">{getInitials(user.full_name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{user.full_name}</h3>

          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {user.phone_number || "Not provided"}
            </span>

            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user.barangay || "Not provided"}
            </span>

            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {user.verification_submitted_at
                ? formatDistanceToNow(new Date(user.verification_submitted_at), { addSuffix: true })
                : "Unknown"}
            </span>
          </div>
        </div>

        <Badge className="w-fit border-0 bg-amber-500/20 text-amber-400">Pending Verification</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-400">
            <FileImage className="h-4 w-4" />
            Government ID
          </Label>

          <div className="flex min-h-[250px] items-center justify-center rounded-xl bg-slate-800 p-4">
            {imagesLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            ) : images?.idUrl ? (
              <img src={images.idUrl} alt="Government ID" className="max-h-[300px] w-full rounded-lg object-contain" />
            ) : (
              <div className="text-center text-slate-500">
                <FileImage className="mx-auto mb-2 h-12 w-12" />
                <p>No ID image</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-400">
            <User className="h-4 w-4" />
            Face Selfie
          </Label>

          <div className="flex min-h-[250px] items-center justify-center rounded-xl bg-slate-800 p-4">
            {imagesLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            ) : images?.selfieUrl ? (
              <img
                src={images.selfieUrl}
                alt="Face Selfie"
                className="max-h-[300px] w-full rounded-lg object-contain"
              />
            ) : (
              <div className="text-center text-slate-500">
                <User className="mx-auto mb-2 h-12 w-12" />
                <p>No selfie image</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRejectInput && (
        <div className="space-y-2">
          <Label className="text-slate-400">Rejection Reason</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            className="border-slate-600 bg-slate-800 text-base text-white placeholder:text-slate-500"
            rows={3}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4 sm:flex-row">
        {!showRejectInput ? (
          <>
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onApprove}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>

            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowRejectInput(true)}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" />
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
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirm Rejection
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationQueue;
