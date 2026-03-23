import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { getDefaultMapCoordinates, resolveMapCoordinates, type MapCoordinates } from "@/lib/map-locations";

export interface BoatLocationMapPoint {
  id: string;
  name: string;
  query: string;
  subtitle?: string;
  type?: string;
  capacity?: number;
  pricePerDay?: number;
  rating?: number;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface ResolvedBoatLocationMapPoint extends BoatLocationMapPoint {
  coordinates: MapCoordinates;
}

interface BoatLocationMapProps {
  points: BoatLocationMapPoint[];
  selectedPointId?: string;
  onSelectPoint?: (pointId: string) => void;
  emptyLabel?: string;
  loadingLabel?: string;
  heightClassName?: string;
}

const BoatLocationMapCanvas = lazy(() => import("./BoatLocationMapCanvas"));

const BoatLocationMap = ({
  points,
  selectedPointId,
  onSelectPoint,
  emptyLabel = "Map data is not available yet.",
  loadingLabel = "Loading map…",
  heightClassName = "h-[320px] md:h-[420px]",
}: BoatLocationMapProps) => {
  const [resolvedPoints, setResolvedPoints] = useState<ResolvedBoatLocationMapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const pointsKey = useMemo(
    () => points.map((point) => `${point.id}:${point.query}:${point.name}`).join("|"),
    [points],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (points.length === 0) {
      setResolvedPoints([]);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    const loadCoordinates = async () => {
      try {
        const nextPoints = await Promise.all(
          points.map(async (point) => ({
            ...point,
            coordinates: await resolveMapCoordinates(point.query),
          })),
        );

        if (!cancelled) {
          setResolvedPoints(nextPoints);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCoordinates();

    return () => {
      cancelled = true;
    };
  }, [points, pointsKey]);

  if (!isClient) {
    return (
      <div className={`w-full ${heightClassName} flex items-center justify-center bg-muted/30`}>
        <p className="text-sm text-muted-foreground">{loadingLabel}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full ${heightClassName} flex items-center justify-center bg-muted/30`}>
        <p className="text-sm text-muted-foreground">{loadingLabel}</p>
      </div>
    );
  }

  if (resolvedPoints.length === 0) {
    return (
      <div className={`w-full ${heightClassName} flex flex-col items-center justify-center gap-3 bg-muted/20 px-6 text-center`}>
        <MapPin className="h-6 w-6 text-aegean" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${heightClassName}`}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <p className="text-sm text-muted-foreground">{loadingLabel}</p>
          </div>
        }
      >
        <BoatLocationMapCanvas
          points={resolvedPoints}
          selectedPointId={selectedPointId}
          onSelectPoint={onSelectPoint}
          defaultCenter={getDefaultMapCoordinates()}
        />
      </Suspense>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-border/80 bg-card/92 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-card">
        Drag, pinch, or scroll to zoom
      </div>
    </div>
  );
};

export default BoatLocationMap;