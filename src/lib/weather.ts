export interface WeatherForecastDay {
  dateKey: string;
  label: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
  rainChance: number;
  windSpeed: number;
}

export interface WeatherForecastSummary {
  locationName: string;
  query: string;
  days: WeatherForecastDay[];
}

const OPEN_WEATHER_URL = "https://api.openweathermap.org";

const getApiKey = () => import.meta.env.VITE_OPENWEATHERMAP_API_KEY?.trim() || "";

const formatWeatherDescription = (value: string) =>
  value.trim().replace(/^\w/, (character) => character.toUpperCase());

const getGroupLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
};

const isForecastPoint = (value: unknown): value is {
  dt_txt?: string;
  main?: { temp_min?: number; temp_max?: number };
  weather?: Array<{ description?: string; icon?: string; main?: string }>;
  pop?: number;
  wind?: { speed?: number };
} => Boolean(value && typeof value === "object");

export const getFiveDayForecast = async (location: string): Promise<WeatherForecastSummary> => {
  const query = location.trim();
  if (!query) {
    throw new Error("Choose a boat location to view the weather forecast.");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenWeatherMap is not configured. Set VITE_OPENWEATHERMAP_API_KEY to enable forecasts.");
  }

  const geoResponse = await fetch(
    `${OPEN_WEATHER_URL}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${encodeURIComponent(apiKey)}`,
  );

  if (!geoResponse.ok) {
    throw new Error("Unable to resolve that location for weather forecasts.");
  }

  const geoResults = (await geoResponse.json()) as Array<{
    name?: string;
    state?: string;
    country?: string;
    lat?: number;
    lon?: number;
  }>;

  const match = Array.isArray(geoResults) ? geoResults[0] : null;
  if (!match || typeof match.lat !== "number" || typeof match.lon !== "number") {
    throw new Error(`No weather location match found for "${query}".`);
  }

  const forecastResponse = await fetch(
    `${OPEN_WEATHER_URL}/data/2.5/forecast?lat=${match.lat}&lon=${match.lon}&appid=${encodeURIComponent(apiKey)}&units=metric`,
  );

  if (!forecastResponse.ok) {
    throw new Error("Unable to load the 5-day weather forecast.");
  }

  const forecastJson = await forecastResponse.json() as {
    list?: unknown[];
  };

  const grouped = new Map<string, Array<NonNullable<WeatherForecastSummary["days"]>[number] & { rawHour: number }>>();

  for (const entry of Array.isArray(forecastJson.list) ? forecastJson.list : []) {
    if (!isForecastPoint(entry) || !entry.dt_txt) {
      continue;
    }

    const [dateKey, timePart = "12:00:00"] = entry.dt_txt.split(" ");
    const rawHour = Number(timePart.slice(0, 2));
    const weather = Array.isArray(entry.weather) ? entry.weather[0] : undefined;

    if (!dateKey || !weather) {
      continue;
    }

    const forecastDay = {
      dateKey,
      label: getGroupLabel(dateKey),
      minTemp: Number(entry.main?.temp_min ?? entry.main?.temp_max ?? 0),
      maxTemp: Number(entry.main?.temp_max ?? entry.main?.temp_min ?? 0),
      description: formatWeatherDescription(weather.description ?? weather.main ?? "Forecast"),
      icon: String(weather.icon ?? "01d"),
      rainChance: Math.round(Number(entry.pop ?? 0) * 100),
      windSpeed: Number(entry.wind?.speed ?? 0),
      rawHour,
    };

    const currentItems = grouped.get(dateKey) ?? [];
    currentItems.push(forecastDay);
    grouped.set(dateKey, currentItems);
  }

  const days = Array.from(grouped.entries())
    .slice(0, 5)
    .map(([dateKey, entries]) => {
      const ordered = [...entries].sort((left, right) => Math.abs(left.rawHour - 12) - Math.abs(right.rawHour - 12));
      const minTemp = Math.min(...entries.map((day) => day.minTemp));
      const maxTemp = Math.max(...entries.map((day) => day.maxTemp));
      const rainChance = Math.max(...entries.map((day) => day.rainChance));
      const windSpeed = Math.max(...entries.map((day) => day.windSpeed));
      const primary = ordered[0] ?? entries[0];

      return {
        dateKey,
        label: primary.label,
        minTemp,
        maxTemp,
        description: primary.description,
        icon: primary.icon,
        rainChance,
        windSpeed,
      } satisfies WeatherForecastDay;
    });

  return {
    locationName:
      [match.name, match.state, match.country].filter(Boolean).join(", ") || query,
    query,
    days,
  };
};
