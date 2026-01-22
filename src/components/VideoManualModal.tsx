import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoManualModalProps {
  open: boolean;
  onClose: () => void;
}

const VideoManualModal = ({ open, onClose }: VideoManualModalProps) => {
  const { t } = useLanguage();
  
  const driveUrl = 'https://drive.google.com/drive/folders/1N_QPbGwtagDRTi3IkcIQclGLEhxreW0j';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Play className="w-5 h-5" />
            {t.helpGuide}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-secondary/50 rounded-lg overflow-hidden">
            <video 
              controls 
              className="w-full aspect-video"
              poster="/placeholder.svg"
            >
              <source src="/videos/user-guide.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Watch the video above to learn how to use SafeNav effectively.
          </p>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Topics covered:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Getting started with SafeNav</li>
              <li>How to report hazards</li>
              <li>Finding safe evacuation routes</li>
              <li>Using emergency hotlines</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>{t.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoManualModal;
