import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Stethoscope,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyError = (err: any) => {
    const code = err?.code || "";

    switch (code) {
      case "auth/user-not-found":
        return "Email address not found.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    setError(null);

    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error("Could not send reset email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-soft px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-primary items-center justify-center shadow-elevated mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Clinic Admin
          </h1>

          <p className="text-muted-foreground mt-1">
            Dr. Muzammil Ambekar — secure portal
          </p>
        </div>

        <Card className="shadow-elevated border-border/60">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <button
                type="button"
                onClick={onForgot}
                className="w-full text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Authorized personnel only. All activity is logged.
        </p>
      </div>
    </div>
  );
}