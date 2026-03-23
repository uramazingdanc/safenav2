import { useState, useRef } from "react";
import { Shield, CheckCircle, Clock, XCircle, Upload, Camera, Loader2, AlertTriangle, FileImage } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSubmitVerification } from "@/hooks/useVerification";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  const submitVerification = useSubmitVerification();

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: t.invalidFile, description: t.selectImageFile, variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t.fileTooLarge, description: t.imageSizeLimit, variant: "destructive" });
        return;
      }
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: t.invalidFile, description: t.selectImageFile, variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t.fileTooLarge, description: t.imageSizeLimit, variant: "destructive" });
        return;
      }
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      toast({ title: t.missingFiles, description: t.uploadBothIdSelfie, variant: "destructive" });
      return;
    }

    try {
      await submitVerification.mutateAsync({ idFile, selfieFile });
      toast({ title: t.success, description: t.verificationSubmitted });
      handleClose();
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({ title: t.submissionFailed, description: error?.message || t.submissionFailed, variant: "destructive" });
    }
  };

  const resetUploadState = () => {
    setIdFile(null);
    setIdPreview(null);
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  const handleClose = () => {
    setIsUploadOpen(false);
    resetUploadState();
  };

  if (verificationStatus === "verified") {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-800">{t.verifiedGuardian}</span>
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {t.verified}
                </Badge>
              </div>
              <p className="text-sm text-emerald-600">{t.verifiedDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-800">{t.verificationPending}</span>
                <Badge className="bg-amber-500 text-white">
                  <Clock className="mr-1 h-3 w-3" />
                  {t.pending}
                </Badge>
              </div>
              <p className="text-sm text-amber-600">{t.pendingDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-red-800">{t.verificationRejected}</span>
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    {t.rejected}
                  </Badge>
                </div>
                {adminNotes && (
                  <p className="mb-2 text-sm text-red-600">
                    <strong>{t.rejectedReason}:</strong> {adminNotes}
                  </p>
                )}
                <Button size="sm" onClick={() => setIsUploadOpen(true)} className="bg-red-600 hover:bg-red-700">
                  <Upload className="mr-2 h-4 w-4" />
                  {t.tryAgain}
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
          t={t}
        />
      </>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-primary">{t.getVerified}</h3>
              <p className="mb-3 text-sm text-muted-foreground">{t.verifyIdentityDesc}</p>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-primary hover:bg-primary/90">
                <Upload className="mr-2 h-4 w-4" />
                {t.startVerification}
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
        t={t}
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
  t: any;
}

const VerificationDialog = ({
  isOpen, onClose, idPreview, selfiePreview, idInputRef, selfieInputRef,
  onIdSelect, onSelfieSelect, onSubmit, isSubmitting, canSubmit, t,
}: VerificationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-lg p-0 sm:rounded-2xl">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-left">
              <Shield className="h-5 w-5 text-primary" />
              {t.identityVerification}
            </DialogTitle>
            <DialogDescription>{t.uploadIdSelfie}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">1. {t.governmentId}</Label>
                <input ref={idInputRef} type="file" accept="image/*" className="hidden" onChange={onIdSelect} />
                <div
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${idPreview ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                  onClick={() => idInputRef.current?.click()}
                >
                  {idPreview ? (
                    <img src={idPreview} alt="ID Preview" className="mx-auto max-h-32 w-full rounded-lg object-contain" />
                  ) : (
                    <div className="py-2">
                      <FileImage className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">{t.uploadGovId}</p>
                      <p className="text-xs text-muted-foreground">{t.driversLicense}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">2. {t.faceSelfie}</Label>
                <input ref={selfieInputRef} type="file" accept="image/*" className="hidden" onChange={onSelfieSelect} />
                <input id="selfie-camera-input" type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfieSelect} />

                {selfiePreview ? (
                  <div className="cursor-pointer rounded-xl border-2 border-dashed border-primary bg-primary/5 p-4 text-center transition-colors" onClick={() => selfieInputRef.current?.click()}>
                    <img src={selfiePreview} alt="Selfie Preview" className="mx-auto max-h-32 w-full rounded-lg object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 text-center transition-colors hover:border-primary/50" onClick={() => selfieInputRef.current?.click()}>
                      <div className="py-2">
                        <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                        <p className="text-sm font-medium">{t.upload}</p>
                        <p className="text-xs text-muted-foreground">{t.fromGallery}</p>
                      </div>
                    </div>
                    <div className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 text-center transition-colors hover:border-primary/50" onClick={() => document.getElementById("selfie-camera-input")?.click()}>
                      <div className="py-2">
                        <Camera className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                        <p className="text-sm font-medium">{t.takeSelfie}</p>
                        <p className="text-xs text-muted-foreground">{t.openCamera}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    <p className="mb-1 font-medium">{t.guidelines}:</p>
                    <ul className="list-inside list-disc space-y-0.5 text-xs">
                      <li>{t.guidelineFaceMatch}</li>
                      <li>{t.guidelineTextVisible}</li>
                      <li>{t.guidelineLighting}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={onClose}>{t.cancel}</Button>
                <Button className="flex-1" disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.submitting}</>
                  ) : (
                    <><Camera className="mr-2 h-4 w-4" />{t.submitForReview}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileVerification;
