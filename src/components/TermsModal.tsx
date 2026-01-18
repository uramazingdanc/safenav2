import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const TermsModal = ({ open, onClose }: TermsModalProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {t.termsAndConditions}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-foreground/80">
            <p className="font-semibold text-foreground">
              Welcome to SafeNav
            </p>
            
            <p>
              By downloading, accessing, or using the SafeNav mobile application ("App"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the App.
            </p>

            <h3 className="font-semibold text-foreground mt-4">1. Purpose of the App</h3>
            <p>
              SafeNav is designed to assist users in navigating safely during emergencies by providing real-time hazard information, evacuation routes, and emergency hotlines. The App is intended for informational purposes only and should not replace official emergency instructions from local authorities.
            </p>

            <h3 className="font-semibold text-foreground mt-4">2. User Eligibility</h3>
            <p>
              You must be at least 13 years old to use the App. If you are under 18, you must have the consent of a parent or guardian to use the App.
            </p>

            <h3 className="font-semibold text-foreground mt-4">3. Account Registration</h3>
            <p>
              To access certain features, you may need to create an account. You agree to provide accurate and complete information during registration and to keep your login credentials secure. You are responsible for all activities under your account.
            </p>

            <h3 className="font-semibold text-foreground mt-4">4. Use of Location Services</h3>
            <p>
              The App uses your device's GPS to provide location-based services. By enabling location services, you consent to the collection and use of your location data as described in our Privacy Policy. You may disable location services at any time through your device settings, but this may limit the App's functionality.
            </p>

            <h3 className="font-semibold text-foreground mt-4">5. User-Generated Content</h3>
            <p>
              You may submit hazard reports and other content through the App. By submitting content, you grant SafeNav a non-exclusive, royalty-free license to use, display, and distribute your content within the App. You are solely responsible for the accuracy and legality of the content you submit.
            </p>

            <h3 className="font-semibold text-foreground mt-4">6. Prohibited Activities</h3>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submit false or misleading hazard reports</li>
              <li>Use the App for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the App's systems</li>
              <li>Interfere with the proper functioning of the App</li>
              <li>Impersonate any person or entity</li>
            </ul>

            <h3 className="font-semibold text-foreground mt-4">7. Disclaimer of Warranties</h3>
            <p>
              The App is provided "as is" without warranties of any kind. SafeNav does not guarantee the accuracy, completeness, or timeliness of the information provided. In emergency situations, always follow official instructions from local authorities.
            </p>

            <h3 className="font-semibold text-foreground mt-4">8. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, SafeNav and its developers shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the App.
            </p>

            <h3 className="font-semibold text-foreground mt-4">9. Privacy</h3>
            <p>
              Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of your data as described therein.
            </p>

            <h3 className="font-semibold text-foreground mt-4">10. Changes to Terms</h3>
            <p>
              SafeNav reserves the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the App constitutes acceptance of the updated Terms.
            </p>

            <h3 className="font-semibold text-foreground mt-4">11. Termination</h3>
            <p>
              SafeNav may terminate or suspend your access to the App at any time, without notice, for conduct that violates these Terms or is harmful to other users or the App.
            </p>

            <h3 className="font-semibold text-foreground mt-4">12. Governing Law</h3>
            <p>
              These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from these Terms or your use of the App shall be resolved in the courts of the Philippines.
            </p>

            <h3 className="font-semibold text-foreground mt-4">13. Contact Information</h3>
            <p>
              For questions or concerns about these Terms, please contact us at:
              <br />
              <a href="mailto:marcchristiancasas@gmail.com" className="text-primary hover:underline">
                marcchristiancasas@gmail.com
              </a>
            </p>

            <p className="mt-6 font-semibold text-foreground">
              By using SafeNav, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>{t.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
