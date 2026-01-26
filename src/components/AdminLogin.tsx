import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import TermsModal from './TermsModal';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in based on role
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the Terms & Conditions to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Sign In Failed',
          description: 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t.success,
        description: 'Authenticating...',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image with Navy Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with command center aesthetic */}
        <div className="absolute inset-0 bg-command command-gradient" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mb-8 border border-white/20">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">SafeNav</h1>
          <p className="text-xl text-white/80 mb-2">Command Center</p>
          <p className="text-sm text-white/60 text-center max-w-md">
            Disaster Risk Management System for Naval, Biliran
          </p>
          
          {/* Status indicators */}
          <div className="mt-12 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/70">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ocean" />
              <span className="text-sm text-white/70">Real-time Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-secondary">
        {/* Mobile header */}
        <div className="lg:hidden bg-command p-4 flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">SafeNav</h1>
            <p className="text-xs text-white/70">Command Center</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-xl border-0 bg-card">
            <CardHeader className="text-center pb-2">
              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-command">Command Center Access</h2>
                <p className="text-muted-foreground mt-1">Sign in to manage emergency operations</p>
              </div>
              <div className="lg:hidden">
                <h2 className="text-xl font-bold text-command">Admin Sign In</h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Security Notice */}
              <div className="bg-command/5 border border-command/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-command">⚠️ Authorized Personnel Only</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  This portal is restricted to emergency management administrators.
                </p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-foreground">{t.email}</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@safenav.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border focus:border-command focus:ring-command"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-foreground">{t.password}</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border-border focus:border-command focus:ring-command pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="admin-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <label htmlFor="admin-terms" className="text-sm text-muted-foreground leading-tight">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-ocean hover:underline font-medium"
                    >
                      Terms & Conditions
                    </button>
                    {' '}and Privacy Policy
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-command hover:bg-command/90 text-white rounded-xl"
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground pt-2">
                <p>Having trouble? Contact your system administrator.</p>
              </div>

              {/* Back to user login */}
              <div className="text-center pt-4 border-t border-border">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-ocean hover:underline"
                  disabled={isLoading}
                >
                  ← Back to User Login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal 
        open={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
    </div>
  );
};

export default AdminLogin;
