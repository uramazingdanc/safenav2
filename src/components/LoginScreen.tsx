import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, HelpCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LanguageToggle from "./LanguageToggle";
import TermsModal from "./TermsModal";
import VideoManualModal from "./VideoManualModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const barangays = [
  "Agpangi",
  "Anislagan",
  "Atipolo",
  "Calumpang",
  "Capiñahan",
  "Caraycaray",
  "Catmon",
  "Haguikhikan",
  "Padre Inocentes García (Pob.)",
  "Libertad",
  "Lico",
  "Lucsoon",
  "Mabini",
  "San Pablo",
  "Santo Niño",
  "Santissimo Rosario Pob.",
  "Talustusan",
  "Villa Caneja",
  "Villa Consuelo",
  "Borac",
  "Cabungaan",
  "Imelda",
  "Larrazabal",
  "Libtong",
  "Padre Sergio Eamiguel",
  "Sabang",
];

const FULL_NAME_REGEX = /^[A-Za-z]+(?:[ A-Za-z]+)*$/;
const PHONE_REGEX = /^09\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeFullName = (value: string) =>
  value
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();

const sanitizePhoneNumber = (value: string) => value.replace(/\D/g, "").slice(0, 11);

const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [barangay, setBarangay] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useLanguage();
  const { user, isAdmin, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const resetFormForModeChange = () => {
    setTermsAccepted(false);
    setShowPassword(false);
    setPassword("");
  };

  const validateSignUpFields = () => {
    if (!fullName.trim() || !phoneNumber.trim() || !barangay || !email.trim() || !password.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (!FULL_NAME_REGEX.test(fullName.trim())) {
      toast({
        title: "Invalid Full Name",
        description: "Full name must contain letters and spaces only.",
        variant: "destructive",
      });
      return false;
    }

    if (!PHONE_REGEX.test(phoneNumber.trim())) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must start with 09 and contain exactly 11 digits.",
        variant: "destructive",
      });
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: 'Email must be in a valid format like "name@name.com".',
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateSignInFields = () => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms and Conditions to continue.",
        variant: "destructive",
      });
      return false;
    }

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: 'Email must be in a valid format like "name@name.com".',
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = isSignUp ? validateSignUpFields() : validateSignInFields();
    if (!isValid) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email.trim(), password, {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          barangay: barangay,
        });

        if (error) {
          let message = error.message;
          if (error.message.includes("already registered")) {
            message = "This email is already registered. Please sign in instead.";
          }

          toast({
            title: "Sign Up Failed",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t.success,
          description: "Account created successfully! Welcome to SafeNav.",
        });
      } else {
        const { error } = await signIn(email.trim(), password);

        if (error) {
          let message = error.message;
          if (error.message.includes("Invalid login credentials")) {
            message = "Invalid email or password. Please try again.";
          }

          toast({
            title: "Sign In Failed",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t.success,
          description: "Welcome back to SafeNav!",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md animate-fade-in shadow-xl">
          <CardHeader className="text-center pb-2">
            {!isSignUp && (
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-primary">{isSignUp ? t.createAccount : "SafeNav"}</h1>
            <p className="text-muted-foreground mt-1">{isSignUp ? "Join SafeNav Emergency Guardian" : t.welcomeBack}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(sanitizeFullName(e.target.value))}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09XXXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(sanitizePhoneNumber(e.target.value))}
                      required
                      disabled={isLoading}
                      inputMode="numeric"
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Barangay</Label>
                    <Select value={barangay} onValueChange={setBarangay} disabled={isLoading}>
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

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignUp ? "Enter your email" : "name@name.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "Create a password (min 6 characters)" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline">
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              {isSignUp ? (
                <p className="text-sm text-center text-muted-foreground">
                  By signing up, you agree to our{" "}
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
                    disabled={isLoading}
                  />
                  <div className="text-sm leading-none">
                    <label htmlFor="terms" className="cursor-pointer">
                      {t.termsAgree}{" "}
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
                disabled={isLoading || (!isSignUp && !termsAccepted)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </>
                ) : isSignUp ? (
                  t.signUp
                ) : (
                  t.signIn
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    resetFormForModeChange();
                  }}
                  className="text-primary font-semibold hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? t.signIn : t.signUp}
                </button>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
              disabled={isLoading}
            >
              <HelpCircle className="w-4 h-4" />
              {t.helpGuide}
            </button>

            <div className="text-center pt-2 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                disabled={isLoading}
              >
                {t.adminAccess} →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <VideoManualModal open={showVideo} onClose={() => setShowVideo(false)} />
    </div>
  );
};

export default LoginScreen;
