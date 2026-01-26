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
  FileImage
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSubmitVerification } from '@/hooks/useVerification';
import { toast } from 'sonner';

interface ProfileVerificationProps {
  verificationStatus: string;
  adminNotes?: string | null;
}

const ProfileVerification = ({ verificationStatus, adminNotes }: ProfileVerificationProps) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const submitVerification = useSubmitVerification();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      await submitVerification.mutateAsync({ file: selectedFile });
      toast.success('ID submitted for verification');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error('Failed to submit verification');
    }
  };

  const handleClose = () => {
    setIsUploadOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
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
                Your ID is being reviewed. Please wait for admin approval.
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

        <UploadDialog 
          isOpen={isUploadOpen}
          onClose={handleClose}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onSubmit={handleSubmit}
          isSubmitting={submitVerification.isPending}
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
                Verify your identity to unlock full access to SafeNav features and become a trusted guardian.
              </p>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload Government ID
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UploadDialog 
        isOpen={isUploadOpen}
        onClose={handleClose}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        onSubmit={handleSubmit}
        isSubmitting={submitVerification.isPending}
      />
    </>
  );
};

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const UploadDialog = ({
  isOpen,
  onClose,
  selectedFile,
  previewUrl,
  fileInputRef,
  onFileSelect,
  onSubmit,
  isSubmitting
}: UploadDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Upload Government ID
          </DialogTitle>
          <DialogDescription>
            Upload a clear photo of your valid government-issued ID for verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              previewUrl 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            
            {previewUrl ? (
              <div className="space-y-3">
                <img 
                  src={previewUrl} 
                  alt="ID Preview" 
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">
                  Click to change image
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Use a valid government ID (Driver's License, Passport, etc.)</li>
                  <li>Ensure all text is clearly visible</li>
                  <li>Avoid glare or shadows</li>
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
              disabled={!selectedFile || isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4 mr-2" />
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
