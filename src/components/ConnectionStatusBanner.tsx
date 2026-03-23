import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const ConnectionStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setShowRecovered(true);
      window.setTimeout(() => setShowRecovered(false), 2200);
    };

    const onOffline = () => {
      setIsOnline(false);
      setShowRecovered(false);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline && !showRecovered) {
    return null;
  }

  const isWarning = !isOnline;

  return (
    <div className="fixed top-1 left-1/2 z-[75] -translate-x-1/2">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-card ${
          isWarning
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900"
        }`}
      >
        <WifiOff className="h-3.5 w-3.5" />
        {isWarning ? "You are offline. Some data may not refresh." : "Back online. Sync resumed."}
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;
