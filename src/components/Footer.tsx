import NautiqLogo from "./NautiqLogo";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <NautiqLogo />
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              The Mediterranean's marketplace for boat rentals and sea experiences.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Browse Boats</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Destinations</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">For Owners</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">List Your Boat</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Owner Dashboard</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-6 text-center text-xs text-muted-foreground">
          © 2026 Nautiq. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
