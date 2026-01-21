import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'admin@safenav.naval';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { user, isAdmin, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin/dashboard');
    }
    // Don't redirect non-admin users from this page - let them try to login
  }, [user, isAdmin, navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate admin email
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      toast({
        title: 'Access Denied',
        description: 'Only authorized admin accounts can access this portal.',
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
        setIsLoading(false);
        return;
      }

      // Force redirect to admin dashboard for admin email
      toast({
        title: t.success,
        description: 'Welcome to SafeNav Command Center!',
      });
      
      // Small delay to allow auth state to settle, then redirect
      setTimeout(() => {
        navigate('/admin/dashboard');
        setIsLoading(false);
      }, 500);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#C62828' }}>
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Login
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md animate-fade-in shadow-2xl border-0">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-[#0D253F] rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                  <Compass className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#0D253F]">{t.adminAccess}</h1>
              <p className="text-muted-foreground mt-1">SafeNav Emergency Guardian</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-[#0D253F] font-medium">
                  Username
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@safenav.naval"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-[#C62828] focus:ring-[#C62828]"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-[#0D253F] font-medium">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-[#C62828] focus:ring-[#C62828]"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold text-white"
                style={{ backgroundColor: '#C62828' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Admin Sign In'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Authorized personnel only. Unauthorized access is prohibited.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
