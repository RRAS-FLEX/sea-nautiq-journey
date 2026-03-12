import { useState } from "react";
import { Menu, X, User, Anchor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NautiqLogo from "./NautiqLogo";
import { Button } from "./ui/button";

interface NavbarProps {
  mode: "customer" | "owner";
  onModeChange: (mode: "customer" | "owner") => void;
}

const Navbar = ({ mode, onModeChange }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <NautiqLogo />

        {/* Mode Toggle */}
        <div className="hidden md:flex items-center bg-muted rounded-full p-1">
          <button
            onClick={() => onModeChange("customer")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "customer"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Customer
          </button>
          <button
            onClick={() => onModeChange("owner")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "owner"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Anchor className="h-3.5 w-3.5" />
            Boat Owner
          </button>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#boats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Boats
          </a>
          <a href="#destinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Destinations
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <Button size="sm" className="bg-gradient-accent text-accent-foreground rounded-full px-5">
            Sign In
          </Button>
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
              <div className="flex items-center bg-muted rounded-full p-1">
                <button
                  onClick={() => onModeChange("customer")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === "customer"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Customer
                </button>
                <button
                  onClick={() => onModeChange("owner")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === "owner"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Anchor className="h-3.5 w-3.5" />
                  Boat Owner
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <a href="#boats" className="text-sm text-muted-foreground py-2">Boats</a>
                <a href="#destinations" className="text-sm text-muted-foreground py-2">Destinations</a>
                <a href="#how-it-works" className="text-sm text-muted-foreground py-2">How It Works</a>
              </div>
              <Button className="w-full bg-gradient-accent text-accent-foreground rounded-full">
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
