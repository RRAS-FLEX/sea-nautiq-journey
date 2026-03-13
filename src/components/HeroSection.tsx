import { Search, MapPin, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-boat.jpg";
import { BoatSearchCriteria } from "@/lib/boat-search";
import { getExperimentVariant, trackExperimentExposure, trackSearchSubmitted } from "@/lib/analytics";
import DateTimePicker from "./DateTimePicker";

interface HeroSectionProps {
  onFindBoats: (criteria: BoatSearchCriteria) => void;
}

const supportedLocations = [
  { name: "Thassos", lat: 40.771, lon: 24.707 },
  { name: "Halkidiki", lat: 40.266, lon: 23.287 },
  { name: "Mykonos", lat: 37.4467, lon: 25.3289 },
  { name: "Santorini", lat: 36.3932, lon: 25.4615 },
];

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
) => {
  const earthRadius = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const HeroSection = ({ onFindBoats }: HeroSectionProps) => {
  const [locationInput, setLocationInput] = useState("");
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [passengersInput, setPassengersInput] = useState("");
  const [locationStatus, setLocationStatus] = useState<string>("");
  const ctaVariant = useMemo(
    () => getExperimentVariant("hero_search_cta", ["find-boats", "search-now"]),
    [],
  );

  useEffect(() => {
    trackExperimentExposure("hero_search_cta", ctaVariant);
  }, [ctaVariant]);

  const isSearchValid = useMemo(() => {
    const passengersValue = Number(passengersInput);
    return Boolean(locationInput.trim() && dateTimeInput && Number.isInteger(passengersValue) && passengersValue > 0);
  }, [locationInput, dateTimeInput, passengersInput]);

  const submitLocationSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSearchValid) {
      return;
    }

    const criteria = {
      location: locationInput.trim(),
      dateTime: dateTimeInput,
      passengers: Number(passengersInput),
    };

    trackSearchSubmitted(criteria);
    onFindBoats(criteria);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported in this browser.");
      return;
    }

    setLocationStatus("Checking nearby supported destinations...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = supportedLocations
          .map((location) => ({
            ...location,
            distanceKm: calculateDistanceKm(
              position.coords.latitude,
              position.coords.longitude,
              location.lat,
              location.lon,
            ),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)[0];

        if (nearest && nearest.distanceKm <= 220) {
          setLocationInput(nearest.name);
          setLocationStatus(`Location allowed: closest supported pickup is ${nearest.name}.`);
          return;
        }

        setLocationStatus("Your current location is outside our supported pickup islands.");
      },
      () => {
        setLocationStatus("Unable to read your location permission.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury boat in turquoise Mediterranean waters"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean/70 via-ocean/50 to-ocean/80" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground leading-[1.1] mb-4">
            Discover Boats.
            <br />
            <span className="text-turquoise">Explore the Sea.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-body max-w-xl mb-8">
            Find and book boats instantly for your perfect island adventure in
            the Greek Mediterranean.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-card rounded-2xl shadow-card-hover p-3 md:p-4 max-w-3xl"
          onSubmit={submitLocationSearch}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <MapPin className="h-5 w-5 text-aegean shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <input
                  type="text"
                  placeholder="Thassos, Greece"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <Calendar className="h-5 w-5 text-aegean shrink-0" />
              <div className="w-full min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Date</p>
                <DateTimePicker
                  value={dateTimeInput}
                  onChange={setDateTimeInput}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <Users className="h-5 w-5 text-aegean shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Passengers</p>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="2"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                  value={passengersInput}
                  onChange={(event) => setPassengersInput(event.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={!isSearchValid} className="bg-gradient-accent text-accent-foreground rounded-xl h-auto py-3 text-base font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Search className="h-5 w-5" />
              {ctaVariant === "search-now" ? "Search Now" : "Find Boats"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap gap-2">
              {supportedLocations.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setLocationInput(item.name)}
                  className="text-xs rounded-full border border-border bg-muted px-3 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  {item.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={detectLocation}
              className="text-xs font-medium text-aegean hover:text-turquoise"
            >
              Use my location
            </button>
          </div>
          {locationStatus ? <p className="text-xs text-muted-foreground mt-2 px-1">{locationStatus}</p> : null}
        </motion.form>

        <div className="mt-4">
          <Link
            to={`/boats${locationInput.trim() ? `?location=${encodeURIComponent(locationInput.trim())}` : ""}`}
            className="text-primary-foreground/80 text-sm hover:text-primary-foreground"
          >
            Open advanced boat finder →
          </Link>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center gap-6 mt-8 text-primary-foreground/60 text-sm"
        >
          <span>🛡️ Verified boats</span>
          <span>⭐ 4.9 average rating</span>
          <span>🌊 500+ trips completed</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
