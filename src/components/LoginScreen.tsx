import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageToggle from './LanguageToggle';
import TermsModal from './TermsModal';
import VideoManualModal from './VideoManualModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const barangays = [
  'Adlaon', 'Agsungot', 'Apas', 'Babag', 'Bacayan', 'Banilad', 'Basak Pardo',
  'Basak San Nicolas', 'Bonbon', 'Budlaan', 'Buhisan', 'Bulacao', 'Busay',
  'Calamba', 'Cambinocot', 'Capitol Site', 'Carreta', 'Central', 'Cogon Pardo',
  'Cogon Ramos', 'Day-as', 'Duljo-Fatima', 'Ermita', 'Guadalupe', 'Guba',
  'Hippodromo', 'Inayawan', 'Kalubihan', 'Kalunasan', 'Kamagayan', 'Kamputhaw',
  'Kasambagan', 'Kinasang-an', 'Labangon', 'Lahug', 'Lorega', 'Lusaran',
  'Luz', 'Mabini', 'Mabolo', 'Malubog', 'Mambaling', 'Pahina Central',
  'Pahina San Nicolas', 'Pamutan', 'Pardo', 'Pari-an', 'Paril', 'Pasil',
  'Pit-os', 'Poblacion Pardo', 'Pulangbato', 'Pung-ol-Sibugay', 'Punta Princesa',
  'Quiot', 'Sambag I', 'Sambag II', 'San Antonio', 'San Jose', 'San Nicolas Central',
  'San Roque', 'Santa Cruz', 'Sawang Calero', 'Sinsin', 'Sirao', 'Suba',
  'Sudlon I', 'Sudlon II', 'T. Padilla', 'Tabunan', 'Tagbao', 'Talamban',
  'Taptap', 'Tejero', 'Tinago', 'Tisa', 'To-ong', 'Zapatera'
];

const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barangay, setBarangay] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        title: 'Terms Required',
        description: 'Please accept the Terms and Conditions to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp) {
      if (!fullName || !phoneNumber || !barangay) {
        toast({
          title: 'Required Fields',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t.success,
        description: 'Account created successfully! Welcome to SafeNav.',
      });
    } else {
      toast({
        title: t.success,
        description: 'Welcome back to SafeNav!',
      });
    }
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
            {!isSignUp && (
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-primary">
              {isSignUp ? t.createAccount : 'SafeNav'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSignUp ? 'Join SafeNav Emergency Guardian' : t.welcomeBack}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>

                  {/* Barangay */}
                  <div className="space-y-2">
                    <Label>Barangay</Label>
                    <Select value={barangay} onValueChange={setBarangay}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select your barangay" />
                      </SelectTrigger>
                      <SelectContent className="bg-card max-h-60">
                        {barangays.map((brgy) => (
                          <SelectItem key={brgy} value={brgy}>
                            {brgy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignUp ? "Enter your email" : "you@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "Create a password (min 6 characters)" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              {/* Terms - Only show checkbox for login, text for signup */}
              {isSignUp ? (
                <p className="text-sm text-center text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t.termsAndConditions}
                  </button>
                </p>
              ) : (
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
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={!isSignUp && !termsAccepted}
                onClick={() => {
                  if (isSignUp) setTermsAccepted(true);
                }}
              >
                {isSignUp ? t.signUp : t.signIn}
              </Button>
            </form>

            {/* Toggle between Login and Signup */}
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setTermsAccepted(false);
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  {isSignUp ? t.signIn : t.signUp}
                </button>
              </p>
            </div>

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
