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
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
  }, [user, isAdmin, navigate]);

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
        setIsLoading(false);
        return;
      }

      // Check if the user has admin role
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (roleData?.role !== 'admin') {
          await supabase.auth.signOut();
          toast({
            title: 'Access Denied',
            description: 'Only admin accounts can access this portal.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: t.success,
          description: 'Welcome to SafeNav Command Center!',
        });
        
        navigate('/admin/dashboard');
      }
      
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: 'Required Field',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        full_name: fullName,
      });

      if (error) {
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'This email is already registered. Please sign in instead.';
        }
        toast({
          title: 'Sign Up Failed',
          description: message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Update the user role to admin
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Update role to admin
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', currentUser.id);

        if (roleError) {
          console.error('Error setting admin role:', roleError);
        }

        toast({
          title: t.success,
          description: 'Admin account created! Welcome to SafeNav Command Center.',
        });
        
        // Small delay to allow role update to propagate
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 500);
      }
      
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-destructive">
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
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                  <Compass className="w-5 h-5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">
                {isSignUp ? 'Admin Registration' : t.adminAccess}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSignUp ? 'Create your admin account' : 'SafeNav Emergency Guardian'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={isSignUp ? handleAdminSignUp : handleAdminSignIn} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="admin-name" className="text-primary font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-primary font-medium">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-primary font-medium">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={isSignUp ? 'Create a password (min 6 chars)' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-destructive hover:bg-destructive/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : isSignUp ? (
                  'Create Admin Account'
                ) : (
                  'Admin Sign In'
                )}
              </Button>
            </form>

            {/* Toggle between Login and Signup */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an admin account?' : "Don't have an admin account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setFullName('');
                  }}
                  className="text-destructive font-semibold hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? 'Sign In' : 'Register'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
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
