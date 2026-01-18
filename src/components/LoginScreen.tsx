import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LanguageToggle from './LanguageToggle';
import TermsModal from './TermsModal';
import VideoManualModal from './VideoManualModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        title: 'Terms Required',
        description: 'Please accept the Terms and Conditions to continue.',
        variant: 'destructive',
      });
      return;
    }
    // Simulate login
    toast({
      title: t.success,
      description: 'Welcome to SafeNav!',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header with Language Toggle */}
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md animate-fade-in shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">SafeNav</h1>
            <p className="text-muted-foreground mt-1">{t.welcomeBack}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2 bg-secondary/50 p-3 rounded-lg">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <div className="text-sm leading-none">
                  <label htmlFor="terms" className="cursor-pointer">
                    {t.termsAgree}{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary font-semibold hover:underline"
                    >
                      {t.termsAndConditions}
                    </button>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={!termsAccepted}
              >
                {t.signIn}
              </Button>
            </form>

            {/* Help Link */}
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
            >
              <HelpCircle className="w-4 h-4" />
              {t.helpGuide}
            </button>

            {/* Admin Access Link */}
            <div className="text-center pt-2 border-t">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                {t.adminAccess} →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <VideoManualModal open={showVideo} onClose={() => setShowVideo(false)} />
    </div>
  );
};

export default LoginScreen;
