import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CloudSun, LoaderCircle, MapPin, ShieldAlert, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { getFiveDayForecast, type WeatherForecastSummary } from "@/lib/weather";

interface WeatherForecastPanelProps {
  locations: string[];
}

const stripWhitespace = (value: string) => value.trim();

const isAdverseForecast = (description: string, rainChance: number) =>
  /storm|thunder|rain|snow|drizzle|sleet|wind/i.test(description) || rainChance >= 50;

const WeatherForecastPanel = ({ locations }: WeatherForecastPanelProps) => {
  const uniqueLocations = useMemo(
    () => Array.from(new Set(locations.map(stripWhitespace).filter(Boolean))),
    [locations],
  );

  const [selectedLocation, setSelectedLocation] = useState(uniqueLocations[0] ?? "");
  const [forecast, setForecast] = useState<WeatherForecastSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLocation && uniqueLocations[0]) {
      setSelectedLocation(uniqueLocations[0]);
    }
  }, [selectedLocation, uniqueLocations]);

  useEffect(() => {
    if (!selectedLocation) {
      setForecast(null);
      setErrorMessage(null);
      return;
    }

    let isActive = true;

    const loadForecast = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextForecast = await getFiveDayForecast(selectedLocation);
        if (isActive) {
          setForecast(nextForecast);
        }
      } catch (error) {
        if (isActive) {
          setForecast(null);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load weather forecasts right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadForecast();

    return () => {
      isActive = false;
    };
  }, [selectedLocation]);

  return (
    <Card className="shadow-card-hover border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-aegean" />
            5-day weather forecast
          </CardTitle>
          <Badge variant="outline" className="w-fit gap-1">
            <Waves className="h-3.5 w-3.5" />
            Plan around rough water
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Check forecast windows before blocking dates for storms or high rain probability.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {uniqueLocations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {uniqueLocations.map((location) => (
              <Button
                key={location}
                type="button"
                variant={selectedLocation === location ? "default" : "outline"}
                size="sm"
                className={selectedLocation === location ? "bg-gradient-accent text-accent-foreground" : ""}
                onClick={() => setSelectedLocation(location)}
              >
                <MapPin className="mr-1 h-3.5 w-3.5" />
                {location}
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
            Add at least one boat location to see live forecast data here.
          </div>
        )}

        {selectedLocation ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{selectedLocation}</p>
              <p className="text-xs text-muted-foreground">
                {forecast?.locationName ? `Resolved to ${forecast.locationName}` : "Live weather lookup in progress"}
              </p>
            </div>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-aegean" /> : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : null}

        {!errorMessage && forecast?.days?.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {forecast.days.map((day) => {
              const adverse = isAdverseForecast(day.description, day.rainChance);
              return (
                <div
                  key={`${day.dateKey}-${day.label}`}
                  className={`rounded-2xl border px-4 py-4 shadow-sm ${adverse ? "border-amber-300 bg-amber-50/80" : "border-border bg-background"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{day.label}</p>
                      <p className="text-xs text-muted-foreground">{day.description}</p>
                    </div>
                    {adverse ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : null}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <img
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.description}
                      className="h-12 w-12"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {Math.round(day.maxTemp)}°
                        <span className="text-sm font-normal text-muted-foreground"> / {Math.round(day.minTemp)}°</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Rain chance {day.rainChance}%</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Wind {Math.round(day.windSpeed)} m/s
                    {adverse ? " · Good candidate to block dates" : " · Looks manageable"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default WeatherForecastPanel;
