import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import NautiqLogo from "./NautiqLogo";
import { Button } from "./ui/button";
import AuthDialog from "./AuthDialog";
import { signOut } from "@/lib/auth-hybrid";
import type { AuthUser } from "@/lib/auth-hybrid";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const { user: currentUser } = useCurrentUser();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthUser(currentUser ?? null);
  }, [currentUser]);

  const handleAuthenticated = async (_user: AuthUser) => {
    // Full reload so all auth-dependent state refreshes cleanly
    window.location.href = "/portal";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthUser(null);
      setMobileOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleBecomeOwner = async () => {
    navigate("/become-owner");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <NautiqLogo />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.home")}
            </Link>
            <Link to="/boats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.boats")}
            </Link>
            <Link to="/destinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.destinations")}
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.about")}
            </Link>
          </>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-3"
            onClick={() => setLanguage(language === "en" ? "el" : "en")}
          >
            {language === "en" ? "EN" : "EL"}
          </Button>
          {authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full px-4 gap-2">
                  {authUser.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>{authUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history">{t("nav.history")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites">{t("nav.favorites")}</Link>
                  </DropdownMenuItem>
                  {!authUser.isOwner && (
                    <DropdownMenuItem onClick={handleBecomeOwner}>
                      {t("nav.becomeOwner")}
                    </DropdownMenuItem>
                  )}
                </>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">{t("nav.settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy-policy">{t("nav.privacySecurity")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about">{t("nav.helpSupport")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>{t("nav.signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="bg-gradient-accent text-accent-foreground rounded-full px-5" onClick={() => setAuthOpen(true)}>
              {t("nav.signIn")}
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-3">
                <>
                  <Link to="/" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>{t("nav.home")}</Link>
                  <Link to="/boats" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>{t("nav.boats")}</Link>
                  <Link to="/destinations" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>{t("nav.destinations")}</Link>
                  <Link to="/about" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>{t("nav.about")}</Link>
                </>
              </div>
              <Button variant="outline" className="w-full rounded-full" onClick={() => setLanguage(language === "en" ? "el" : "en")}>
                {t("nav.language")}: {language === "en" ? "EN" : "EL"}
              </Button>
              {authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full rounded-full justify-between">
                      {t("nav.accountMenu")}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>{authUser.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" onClick={() => setMobileOpen(false)}>
                          {t("nav.profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/history" onClick={() => setMobileOpen(false)}>
                          {t("nav.history")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/favorites" onClick={() => setMobileOpen(false)}>
                          {t("nav.favorites")}
                        </Link>
                      </DropdownMenuItem>
                      {!authUser.isOwner && (
                        <DropdownMenuItem onClick={() => { handleBecomeOwner(); setMobileOpen(false); }}>
                          {t("nav.becomeOwner")}
                        </DropdownMenuItem>
                      )}
                    </>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" onClick={() => setMobileOpen(false)}>{t("nav.settings")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-policy" onClick={() => setMobileOpen(false)}>{t("nav.privacySecurity")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" onClick={() => setMobileOpen(false)}>{t("nav.helpSupport")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>{t("nav.signOut")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="w-full bg-gradient-accent text-accent-foreground rounded-full" onClick={() => setAuthOpen(true)}>
                  {t("nav.signIn")}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={handleAuthenticated}
      />
    </nav>
  );
};

export default Navbar;
