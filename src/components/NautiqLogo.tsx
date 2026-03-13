import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

const NautiqLogo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 ${className}`}>
    <div className="relative">
      <Compass className="h-8 w-8 text-aegean" strokeWidth={1.5} />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl font-heading font-bold tracking-tight text-foreground">
        Nautiq
      </span>
      <span className="text-[10px] font-body uppercase tracking-[0.2em] text-muted-foreground">
        Sea Experiences
      </span>
    </div>
  </Link>
);

export default NautiqLogo;
