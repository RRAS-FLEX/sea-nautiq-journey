import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NautiqLogo from "./NautiqLogo";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import AuthDialog from "./AuthDialog";
import { signOut } from "@/lib/auth-hybrid";
import type { AuthUser } from "@/lib/auth-hybrid";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface NavbarProps {
  mode?: "customer" | "owner";
  onModeChange?: (mode: "customer" | "owner") => void;
}

const Navbar = ({ mode, onModeChange }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const { user: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const inferredMode: "customer" | "owner" = location.pathname.includes("owner") ? "owner" : "customer";
  const activeMode = mode ?? inferredMode;

  useEffect(() => {
    setAuthUser(currentUser ?? null);
  }, [currentUser]);

  const handleAuthenticated = async (user: AuthUser) => {
    setAuthUser(user);
    navigate("/portal");
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

  const handleModeSwitch = (nextMode: "customer" | "owner") => {
    if (onModeChange) {
      onModeChange(nextMode);
      return;
    }
    navigate(nextMode === "owner" ? "/owner-profile" : "/customer-profile");
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
              Home
            </Link>
            <Link to="/boats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Boats
            </Link>
            <Link to="/destinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Destinations
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </>
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
                    <Link to={authUser.isOwner && activeMode === "owner" ? "/owner-profile" : "/customer-profile"}>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history">History</Link>
                  </DropdownMenuItem>
                  {!authUser.isOwner && (
                    <DropdownMenuItem onClick={handleBecomeOwner}>
                      Become an Owner
                    </DropdownMenuItem>
                  )}
                  {authUser.isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between cursor-default">
                        <span className="text-sm">Owner Mode</span>
                        <Switch
                          checked={activeMode === "owner"}
                          onCheckedChange={(checked) => handleModeSwitch(checked ? "owner" : "customer")}
                        />
                      </DropdownMenuItem>
                    </>
                  )}
                </>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy-policy">Privacy & Security</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about">Help & Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="bg-gradient-accent text-accent-foreground rounded-full px-5" onClick={() => setAuthOpen(true)}>
              Sign In
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
                  <Link to="/" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Home</Link>
                  <Link to="/boats" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Boats</Link>
                  <Link to="/destinations" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Destinations</Link>
                  <Link to="/about" className="text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>About</Link>
                </>
              </div>
              {authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full rounded-full justify-between">
                      Account Menu
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>{authUser.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={authUser.isOwner && activeMode === "owner" ? "/owner-profile" : "/customer-profile"} onClick={() => setMobileOpen(false)}>
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/history" onClick={() => setMobileOpen(false)}>
                          History
                        </Link>
                      </DropdownMenuItem>
                      {!authUser.isOwner && (
                        <DropdownMenuItem onClick={() => { handleBecomeOwner(); setMobileOpen(false); }}>
                          Become an Owner
                        </DropdownMenuItem>
                      )}
                      {authUser.isOwner && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between cursor-default">
                            <span className="text-sm">Owner Mode</span>
                            <Switch
                              checked={activeMode === "owner"}
                              onCheckedChange={(checked) => { handleModeSwitch(checked ? "owner" : "customer"); setMobileOpen(false); }}
                            />
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" onClick={() => setMobileOpen(false)}>Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-policy" onClick={() => setMobileOpen(false)}>Privacy & Security</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" onClick={() => setMobileOpen(false)}>Help & Support</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="w-full bg-gradient-accent text-accent-foreground rounded-full" onClick={() => setAuthOpen(true)}>
                  Sign In
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
