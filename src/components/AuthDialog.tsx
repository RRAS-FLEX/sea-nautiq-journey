import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth-hybrid";
import type { AuthUser } from "@/lib/auth-hybrid";
import { getRememberMePreference, setRememberMePreference } from "@/lib/auth-session";
import { isGoogleClientIdUsable, sanitizeGoogleClientId } from "@/lib/google-oauth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: (user: AuthUser) => void;
}

const AuthDialog = ({ open, onOpenChange, onAuthenticated }: AuthDialogProps) => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [errorMessage, setErrorMessage] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(getRememberMePreference());

  const googleClientId = sanitizeGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const hasUsableGoogleClientId = isGoogleClientIdUsable(googleClientId);
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const onAuthSuccess = (user: AuthUser) => {
    setErrorMessage("");
    onAuthenticated(user);
    onOpenChange(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(window.location.href, { rememberMe });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to complete Google sign in.");
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setRememberMePreference(rememberMe);

    try {
      const user = await signInWithEmail(signInEmail, signInPassword, { rememberMe });
      onAuthSuccess(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (signUpPassword !== signUpPasswordConfirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setRememberMePreference(rememberMe);

    try {
      const user = await signUpWithEmail(signUpName, signUpEmail, signUpPassword, { rememberMe });
      onAuthSuccess(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-aegean/20">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Nautiq</DialogTitle>
          <DialogDescription>
            Fast sign in with Google or continue with email.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "signin" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {hasUsableGoogleClientId ? (
              <div className="w-full">
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                  Continue with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full" disabled>
                  Google Sign-In not configured
                </Button>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set a valid <strong>VITE_GOOGLE_CLIENT_ID</strong> in .env and add <strong>{currentOrigin}</strong> to Authorized JavaScript origins in Google Cloud.
                </p>
              </div>
            )}
          </div>

          <TabsContent value="signin" className="mt-4">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="captain@nautiq.com"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={signInPassword}
                  onChange={(event) => setSignInPassword(event.target.value)}
                  required
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="remember-me" className="cursor-pointer text-sm font-medium">
                    Remember me for 30 days
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Keep this device signed in by storing the refresh token locally.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full gap-2 bg-gradient-accent text-accent-foreground">
                <Mail className="h-4 w-4" />
                Sign In with Email
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Captain Marina"
                  value={signUpName}
                  onChange={(event) => setSignUpName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="captain@nautiq.com"
                  value={signUpEmail}
                  onChange={(event) => setSignUpEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={signUpPassword}
                  onChange={(event) => setSignUpPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password-confirm">Confirm Password</Label>
                <Input
                  id="signup-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={signUpPasswordConfirm}
                  onChange={(event) => setSignUpPasswordConfirm(event.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full gap-2 bg-gradient-accent text-accent-foreground">
                <Mail className="h-4 w-4" />
                Create Email Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;