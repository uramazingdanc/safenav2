import { useState, useRef } from 'react';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Upload, 
  Camera,
  Loader2,
  AlertTriangle,
  FileImage,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSubmitVerification } from '@/hooks/useVerification';
import { useToast } from '@/hooks/use-toast';

interface ProfileVerificationProps {
  verificationStatus: string;
  adminNotes?: string | null;
}

const ProfileVerification = ({ verificationStatus, adminNotes }: ProfileVerificationProps) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const submitVerification = useSubmitVerification();

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      toast({
        title: 'Missing Files',
        description: 'Please upload both your ID and selfie',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitVerification.mutateAsync({ 
        idFile, 
        selfieFile 
      });
      toast({
        title: 'Success',
        description: 'Verification submitted successfully! Please wait for admin review.',
      });
      handleClose();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit verification. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setIsUploadOpen(false);
    setIdFile(null);
    setIdPreview(null);
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  // Render based on verification status
  if (verificationStatus === 'verified') {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-800">Verified Guardian</span>
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-emerald-600">
                Your identity has been verified by SafeNav administrators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-800">Verification In Progress</span>
                <Badge className="bg-amber-500 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </div>
              <p className="text-sm text-amber-600">
                Your ID and selfie are being reviewed. Please wait for admin approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-red-800">Verification Rejected</span>
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                </div>
                {adminNotes && (
                  <p className="text-sm text-red-600 mb-2">
                    <strong>Reason:</strong> {adminNotes}
                  </p>
                )}
                <Button 
                  size="sm" 
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <VerificationDialog 
          isOpen={isUploadOpen}
          onClose={handleClose}
          idPreview={idPreview}
          selfiePreview={selfiePreview}
          idInputRef={idInputRef}
          selfieInputRef={selfieInputRef}
          onIdSelect={handleIdSelect}
          onSelfieSelect={handleSelfieSelect}
          onSubmit={handleSubmit}
          isSubmitting={submitVerification.isPending}
          canSubmit={!!idFile && !!selfieFile}
        />
      </>
    );
  }

  // Unverified - show "Get Verified" card
  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">Get Verified</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Verify your identity with a government ID and face selfie to unlock full SafeNav features.
              </p>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <VerificationDialog 
        isOpen={isUploadOpen}
        onClose={handleClose}
        idPreview={idPreview}
        selfiePreview={selfiePreview}
        idInputRef={idInputRef}
        selfieInputRef={selfieInputRef}
        onIdSelect={handleIdSelect}
        onSelfieSelect={handleSelfieSelect}
        onSubmit={handleSubmit}
        isSubmitting={submitVerification.isPending}
        canSubmit={!!idFile && !!selfieFile}
      />
    </>
  );
};

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  idPreview: string | null;
  selfiePreview: string | null;
  idInputRef: React.RefObject<HTMLInputElement>;
  selfieInputRef: React.RefObject<HTMLInputElement>;
  onIdSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelfieSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const VerificationDialog = ({
  isOpen,
  onClose,
  idPreview,
  selfiePreview,
  idInputRef,
  selfieInputRef,
  onIdSelect,
  onSelfieSelect,
  onSubmit,
  isSubmitting,
  canSubmit
}: VerificationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            Upload your government ID and a face selfie for verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Government ID Upload */}
          <div className="space-y-2">
            <Label className="font-medium">1. Government ID</Label>
            <input
              ref={idInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onIdSelect}
            />
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                idPreview 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => idInputRef.current?.click()}
            >
              {idPreview ? (
                <img 
                  src={idPreview} 
                  alt="ID Preview" 
                  className="max-h-32 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="py-2">
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Government ID</p>
                  <p className="text-xs text-muted-foreground">Driver's License, Passport, etc.</p>
                </div>
              )}
            </div>
          </div>

          {/* Selfie Upload */}
          <div className="space-y-2">
            <Label className="font-medium">2. Face Selfie</Label>
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={onSelfieSelect}
            />
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                selfiePreview 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => selfieInputRef.current?.click()}
            >
              {selfiePreview ? (
                <img 
                  src={selfiePreview} 
                  alt="Selfie Preview" 
                  className="max-h-32 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="py-2">
                  <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Take a Selfie</p>
                  <p className="text-xs text-muted-foreground">Clear photo of your face</p>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Ensure your face in the selfie matches the ID photo</li>
                  <li>All text on ID must be clearly visible</li>
                  <li>Good lighting, no shadows or glare</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              disabled={!canSubmit || isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileVerification;
