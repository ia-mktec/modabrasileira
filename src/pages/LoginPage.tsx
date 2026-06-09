import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: t("auth.signUpErrorTitle"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.signUpSuccessTitle"), description: t("auth.signUpSuccessDescription") });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: t("auth.signInErrorTitle"), description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4 w-32">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-xl bg-primary">
            <Factory className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.appTitle")}</CardTitle>
          <CardDescription>
            {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> {t("auth.signUp")}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> {t("auth.signIn")}
                </>
              )}
            </Button>
            {!isSignUp && (
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? t("auth.toggleToSignIn") : t("auth.toggleToSignUp")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
