import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { user, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in based on role - wait for loading to complete
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        // Non-admin trying to access admin login - redirect to user dashboard
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Navigation will be handled by useEffect when user/isAdmin state updates
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-destructive/10 to-destructive/5 flex flex-col admin-theme">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Login
        </button>
        <LanguageToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md animate-fade-in shadow-xl border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldAlert className="w-10 h-10 text-destructive-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-destructive">{t.adminAccess}</h1>
            <p className="text-muted-foreground mt-1">Command Center Portal</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <strong>⚠️ Authorized Personnel Only</strong>
              <p className="mt-1 text-muted-foreground">
                This portal is for emergency management administrators only.
              </p>
            </div>

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t.email}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@safenav.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-destructive/30 focus:border-destructive"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.password}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-destructive/30 focus:border-destructive"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-destructive hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Access Command Center'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>Having trouble? Contact your system administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
