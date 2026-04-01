import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { addDays, addHours, format, isSameDay, isWeekend, parseISO, startOfDay } from "date-fns";
import { CalendarCheck2, CalendarDays, Clock, CreditCard, Fuel, LogIn, Mail, MapPin, MessageCircle, Navigation, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import BoatLocationMap from "@/components/BoatLocationMap";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { confirmBookingWorkflow, getAvailableDepartureTimes, getRecommendedDepartureTimes, type ConfirmBookingResult, type DepartureRecommendation } from "@/lib/booking-workflow";
import { buildBoatDetailsPath, buildBoatPublicSlug, getBoatByPublicReference, getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { trackBookingConfirmed, trackBookingStarted } from "@/lib/analytics";
import { signInWithGoogle } from "@/lib/auth-hybrid";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";

const packages = [
  { id: "three-hours", label: "3 Hour Escape", hours: 3, multiplier: 0.45, baseFuelLitres: 24, vibe: "Quick swim stops and golden-hour speed." },
  { id: "half-day", label: "Half Day", hours: 5, multiplier: 0.72, baseFuelLitres: 38, vibe: "The most balanced mix of cruising and island time." },
  { id: "full-day", label: "Full Day", hours: 8, multiplier: 1, baseFuelLitres: 62, vibe: "The full cinematic route with multiple bays and lunch stops." },
] as const;

type PaymentMethod = "stripe" | "manual";

const paymentMethodOptions: Array<{ id: PaymentMethod; label: string; description: string }> = [
  { id: "stripe", label: "Stripe Checkout", description: "Card, Apple Pay, Google Pay, and more" },
  { id: "manual", label: "Choose payment plan", description: "Reserve now, pay in cash or card on arrival" },
];

type OwnerPackageJoinRow = {
  package_id: string;
  owner_packages: {
    name?: string | null;
    price?: number | null;
  } | null;
};

type BookingRealtimeRow = {
  start_date?: string | null;
};

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: sessionUser } = useCurrentUser();
  const { toast } = useToast();
  const { tl } = useLanguage();
  const boatReference = searchParams.get("boatRef") ?? searchParams.get("boatId");
  const boatNameFromQuery = searchParams.get("boat") ?? "Selected boat";
  const dateFromQuery = searchParams.get("date") ?? "";
  const parsedDateFromQuery = dateFromQuery ? parseISO(dateFromQuery) : null;
  const initialSelectedDate = parsedDateFromQuery && !Number.isNaN(parsedDateFromQuery.getTime())
    ? startOfDay(parsedDateFromQuery)
    : undefined;
  const [boat, setBoat] = useState<Boat | null>(null);
  const [isBoatLoading, setIsBoatLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBoat = async () => {
      if (!cancelled) {
        setIsBoatLoading(true);
      }

      try {
        if (boatReference) {
          const resolved = await getBoatByPublicReference(boatReference);
          if (resolved) {
            if (!cancelled) {
              setBoat(resolved);
              setIsBoatLoading(false);
            }
            return;
          }
        }

        const boats = await getBoats();
        const byName = boats.find((entry) => entry.name === boatNameFromQuery) ?? null;
        if (!cancelled) {
          setBoat(byName);
          setIsBoatLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBoat(null);
          setIsBoatLoading(false);
        }
      }
    };

    loadBoat();

    return () => {
      cancelled = true;
    };
  }, [boatReference, boatNameFromQuery]);
  const boatName = boat?.name ?? boatNameFromQuery;
  const dailyRate = boat?.pricePerDay ?? 450;
  const [selectedPackageId, setSelectedPackageId] = useState<(typeof packages)[number]["id"]>("half-day");
  const [fuelLitres, setFuelLitres] = useState([40]);
  const [guestCount, setGuestCount] = useState(4);
  const [includeSkipper, setIncludeSkipper] = useState(true);
  const [includeFlexibleCancellation, setIncludeFlexibleCancellation] = useState(false);
  const [ownerUpgrades, setOwnerUpgrades] = useState<Array<{ id: string; label: string; price: number }>>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate);
  const [hasDateIntent, setHasDateIntent] = useState(Boolean(initialSelectedDate));
  const [departureTime, setDepartureTime] = useState("");
  const [customerName, setCustomerName] = useState(sessionUser?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(sessionUser?.email ?? "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [workflowResult, setWorkflowResult] = useState<ConfirmBookingResult | null>(null);
  const [availableDepartureTimes, setAvailableDepartureTimes] = useState<string[]>([]);
  const [departureRecommendations, setDepartureRecommendations] = useState<DepartureRecommendation[]>([]);
  const [isLoadingDepartureTimes, setIsLoadingDepartureTimes] = useState(false);
  const [bookingsRealtimeTick, setBookingsRealtimeTick] = useState(0);
  const [liveAvailabilityNotice, setLiveAvailabilityNotice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<"deposit" | "full" | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [autoUnavailableDates, setAutoUnavailableDates] = useState<Date[]>([]);

  useEffect(() => {
    if (sessionUser?.name && !customerName) {
      setCustomerName(sessionUser.name);
    }
    if (sessionUser?.email && !customerEmail) {
      setCustomerEmail(sessionUser.email);
    }
  }, [sessionUser, customerEmail, customerName]);

  useEffect(() => {
    const loadOwnerUpgrades = async () => {
      if (!boat?.id) {
        setOwnerUpgrades([]);
        return;
      }

      const { data, error } = await supabase
        .from("owner_package_boats")
        .select("package_id, owner_packages(name, price)")
        .eq("boat_id", boat.id);

      if (error || !Array.isArray(data)) {
        setOwnerUpgrades([]);
        return;
      }

      const mapped = (data as OwnerPackageJoinRow[])
        .filter((row) => row.owner_packages?.name)
        .map((row) => ({
          id: row.package_id,
          label: row.owner_packages.name,
          price: Number(row.owner_packages.price ?? 0),
        }));

      setOwnerUpgrades(mapped);
      setSelectedExtras((current) => current.filter((id) => mapped.some((item) => item.id === id)));
    };

    loadOwnerUpgrades();
  }, [boat?.id]);

  useEffect(() => {
    if (boat?.skipperRequired) {
      setIncludeSkipper(true);
    }
  }, [boat?.skipperRequired]);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? packages[1];
  const basePackagePrice = Math.round(dailyRate * selectedPackage.multiplier);
  const fuelPricePerLitre = 1.95;
  const showFuelEstimate = !boat?.skipperRequired;
  const fuelCost = showFuelEstimate ? Math.round(fuelLitres[0] * fuelPricePerLitre) : 0;
  const skipperCost = includeSkipper ? Math.round(selectedPackage.hours * 28) : 0;
  const guestExperienceFee = Math.max(guestCount - 4, 0) * 18;
  const flexibleCancellationCost = includeFlexibleCancellation ? Math.round(basePackagePrice * 0.12) : 0;
  const extrasCost = ownerUpgrades
    .filter((item) => selectedExtras.includes(item.id))
    .reduce((total, item) => total + item.price, 0);
  const crazySeaRoutingFee = selectedPackageId === "full-day" ? 95 : 0;
  const suggestedFuelLitres = Math.min(120, selectedPackage.baseFuelLitres + Math.max(guestCount - 4, 0) * 2);
  const staticUnavailableDates = useMemo(
    () => boat?.availability.unavailableDates.map((date) => parseISO(date)) ?? [],
    [boat],
  );
  const unavailableDates = useMemo(() => {
    const combined = [...staticUnavailableDates, ...autoUnavailableDates];
    if (combined.length === 0) return combined;
    const seen = new Set<number>();
    return combined.filter((date) => {
      const key = startOfDay(date).getTime();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [staticUnavailableDates, autoUnavailableDates]);
  const nextAvailableDate = useMemo(() => {
    return Array.from({ length: 21 }, (_, index) => addDays(startOfDay(new Date()), index)).find(
      (date) => !unavailableDates.some((blockedDate) => isSameDay(blockedDate, date)),
    );
  }, [unavailableDates]);
  const boatProfileLink = boat ? buildBoatDetailsPath(boat) : "/boats";
  const mapQuery = boat?.mapQuery ?? "";
  const googleDirectionsUrl = boat ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}` : "/boats";
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  const stripeCheckoutEndpoint = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}/api/stripe/create-checkout`
    : "/api/stripe/create-checkout";

  const estimatedTotal = useMemo(
    () =>
      basePackagePrice +
      fuelCost +
      skipperCost +
      guestExperienceFee +
      flexibleCancellationCost +
      extrasCost +
      crazySeaRoutingFee,
    [
      basePackagePrice,
      crazySeaRoutingFee,
      extrasCost,
      flexibleCancellationCost,
      fuelCost,
      guestExperienceFee,
      skipperCost,
    ],
  );

  const platformCommission = Math.round(estimatedTotal * 0.15);
  const ownerPayout = Math.max(estimatedTotal - platformCommission, 0);
  const depositAmount = Math.round(estimatedTotal * 0.3);
  const amountDueNow = paymentPlan === "deposit" ? depositAmount : estimatedTotal;
  const canContinueStep1 = Boolean(selectedDate && availableDepartureTimes.includes(departureTime));
  const canContinueStep2 = Boolean(customerName.trim() && customerEmail.trim());
  const canContinueStep3 = Boolean(
    paymentMethod &&
    paymentPlan,
  );

  const selectedExtraLabels = useMemo(
    () => ownerUpgrades.filter((item) => selectedExtras.includes(item.id)).map((item) => item.label),
    [selectedExtras, ownerUpgrades],
  );

  useEffect(() => {
    if (!boat?.id) {
      setAutoUnavailableDates([]);
      return;
    }

    let cancelled = false;
    const computeAutoUnavailable = async () => {
      const today = startOfDay(new Date());
      const horizonDays = 30;
      const daysToCheck = Array.from({ length: horizonDays }, (_, index) => addDays(today, index));

      const dynamicDates: Date[] = [];
      for (const date of daysToCheck) {
        if (cancelled) return;

        // Skip dates already statically unavailable
        if (staticUnavailableDates.some((blockedDate) => isSameDay(blockedDate, date))) {
          continue;
        }

        const isoDate = format(date, "yyyy-MM-dd");
        const availableTimes = await getAvailableDepartureTimes(boat.id, isoDate, selectedPackage.hours);
        if (cancelled) return;

        if (availableTimes.length === 0) {
          dynamicDates.push(date);
        }
      }

      if (!cancelled) {
        setAutoUnavailableDates(dynamicDates);
      }
    };

    computeAutoUnavailable();

    return () => {
      cancelled = true;
    };
  }, [boat?.id, selectedPackage.hours, staticUnavailableDates]);

  useEffect(() => {
    let cancelled = false;

    const loadAvailableTimes = async () => {
      if (!boat?.id || !selectedDate) {
        if (!cancelled) {
          setAvailableDepartureTimes([]);
          setDepartureRecommendations([]);
        }
        return;
      }

      if (unavailableDates.some((blockedDate) => isSameDay(blockedDate, selectedDate))) {
        if (!cancelled) {
          setAvailableDepartureTimes([]);
          setDepartureRecommendations([]);
        }
        if (hasDateIntent) {
          navigate(
            `/booking-closed?boat=${encodeURIComponent(boat.name)}&date=${encodeURIComponent(format(selectedDate, "yyyy-MM-dd"))}&reason=${encodeURIComponent("date-unavailable")}`,
          );
        }
        return;
      }

      setIsLoadingDepartureTimes(true);
      try {
        const nextRecommendations = await getRecommendedDepartureTimes(
          boat.id,
          format(selectedDate, "yyyy-MM-dd"),
          selectedPackage.hours,
        );

        if (cancelled) {
          return;
        }

        const nextTimes = nextRecommendations.map((item) => item.departureTime);
        setDepartureRecommendations(nextRecommendations);
        setAvailableDepartureTimes(nextTimes);

        if (nextTimes.length > 0) {
          setDepartureTime((current) => (nextTimes.includes(current) ? current : ""));
          return;
        }

        if (hasDateIntent) {
          navigate(
            `/booking-closed?boat=${encodeURIComponent(boat.name)}&date=${encodeURIComponent(format(selectedDate, "yyyy-MM-dd"))}&reason=${encodeURIComponent("day-fully-booked")}`,
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDepartureTimes(false);
        }
      }
    };

    loadAvailableTimes();

    return () => {
      cancelled = true;
    };
  }, [boat?.id, boat?.name, bookingsRealtimeTick, hasDateIntent, navigate, selectedDate, selectedPackage.hours, unavailableDates]);

  useEffect(() => {
    if (!boat?.id || !selectedDate) {
      return;
    }

    const selectedDateValue = format(selectedDate, "yyyy-MM-dd");
    const channel = supabase
      .channel(`bookings-live-${boat.id}-${selectedDateValue}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `boat_id=eq.${boat.id}`,
        },
        (payload) => {
          const row = payload.new ?? payload.old;
          const changedDate = row && typeof row === "object"
            ? String((row as BookingRealtimeRow).start_date ?? "")
            : "";
          if (changedDate === selectedDateValue) {
            setBookingsRealtimeTick((value) => value + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boat?.id, selectedDate]);

  useEffect(() => {
    if (bookingsRealtimeTick <= 0) {
      return;
    }

    setLiveAvailabilityNotice(true);
    const timeout = window.setTimeout(() => setLiveAvailabilityNotice(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [bookingsRealtimeTick]);

  useEffect(() => {
    if (!boat) {
      return;
    }

    trackBookingStarted({
      boatId: boat.id,
      boatName: boat.name,
      source: "booking_page",
    });
  }, [boat]);

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((currentExtras) =>
      currentExtras.includes(extraId)
        ? currentExtras.filter((item) => item !== extraId)
        : [...currentExtras, extraId],
    );
  };

  const handleConfirmBooking = async () => {
    if (!boat) {
      toast({
        title: tl("Boat not found", "Το σκάφος δεν βρέθηκε"),
        description: isBoatLoading
          ? tl("Boat data is still loading. Please wait a moment and try again.", "Τα στοιχεία του σκάφους φορτώνουν ακόμα. Περίμενε λίγο και δοκίμασε ξανά.")
          : tl("Open the boat profile again and retry the booking.", "Άνοιξε ξανά το προφίλ του σκάφους και δοκίμασε ξανά την κράτηση."),
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: tl("Missing customer details", "Λείπουν στοιχεία πελάτη"),
        description: tl("Add your full name and email before confirming the booking.", "Συμπλήρωσε ονοματεπώνυμο και email πριν την επιβεβαίωση της κράτησης."),
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: tl("Select a date", "Επίλεξε ημερομηνία"),
        description: tl("Choose an available date from the calendar before confirming.", "Επίλεξε διαθέσιμη ημερομηνία από το ημερολόγιο πριν την επιβεβαίωση."),
        variant: "destructive",
      });
      return;
    }

    if (availableDepartureTimes.length === 0 || !availableDepartureTimes.includes(departureTime)) {
      navigate(
        `/booking-closed?boat=${encodeURIComponent(boat.name)}&date=${encodeURIComponent(selectedDate.toISOString().slice(0, 10))}&reason=${encodeURIComponent("slot-unavailable")}`,
      );
      return;
    }

    if (selectedPackage.hours > 8) {
      toast({
        title: tl("Package too long", "Το πακέτο είναι πολύ μεγάλο"),
        description: tl("Customers cannot book a boat for more than 8 hours.", "Οι πελάτες δεν μπορούν να κλείσουν σκάφος για περισσότερες από 8 ώρες."),
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: tl("Select payment method", "Επίλεξε τρόπο πληρωμής"),
        description: tl("Choose a payment method before confirming.", "Επίλεξε τρόπο πληρωμής πριν την επιβεβαίωση."),
        variant: "destructive",
      });
      return;
    }

    if (!paymentPlan) {
      toast({
        title: tl("Select payment plan", "Επίλεξε πλάνο πληρωμής"),
        description: tl("Choose deposit or full payment before confirming.", "Επίλεξε προκαταβολή ή πλήρη πληρωμή πριν την επιβεβαίωση."),
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "stripe") {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const checkoutResponse = await fetch(stripeCheckoutEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            boatId: boat.id,
            boatName: boat.name,
            customerEmail: customerEmail.trim().toLowerCase(),
            customerId: sessionUser?.id,
            bookingDate: format(selectedDate, "yyyy-MM-dd"),
            departureTime,
            packageHours: selectedPackage.hours,
            totalPrice: estimatedTotal,
            amountDueNow,
            paymentPlan,
            depositAmount,
            successUrl: `${window.location.origin}/booking-confirmed`,
            cancelUrl: window.location.href,
          }),
        });

        const checkoutRaw = await checkoutResponse.text();
        let checkoutPayload: { sessionId?: string; checkoutUrl?: string; error?: string } = {};
        if (checkoutRaw) {
          try {
            checkoutPayload = JSON.parse(checkoutRaw);
          } catch {
            throw new Error("Stripe checkout API returned a non-JSON response. Check Vite /api proxy and API server logs.");
          }
        }
        if (!checkoutResponse.ok) {
          throw new Error(checkoutPayload?.error ?? "Failed to create checkout session");
        }

        const checkoutUrl = String(checkoutPayload.checkoutUrl ?? "").trim();
        if (checkoutUrl) {
          window.location.assign(checkoutUrl);
          return;
        }

        throw new Error("Stripe checkout URL is missing from API response.");

        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Checkout failed";
        const normalized = message.toLowerCase();
        const isConfigOrNetworkIssue =
          normalized.includes("fetch failed") ||
          normalized.includes("failed to fetch") ||
          normalized.includes("network") ||
          normalized.includes("not configured") ||
          normalized.includes("supabase admin");

        toast({
          title: tl("Stripe checkout failed", "Αποτυχία checkout Stripe"),
          description: isConfigOrNetworkIssue
            ? `${message}. Check API server env (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY) and VITE_API_BASE_URL/proxy.`
            : message,
          variant: "destructive",
        });
        return;
      }
    }

    const shouldQueueCustomerEmail = customerEmail.trim().length > 0;
    let result: ConfirmBookingResult;

    try {
      result = await confirmBookingWorkflow({
        boatId: boat.id,
        boatName: boat.name,
        ownerName: boat.owner.name || "Owner",
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        packageLabel: selectedPackage.label,
        packageHours: selectedPackage.hours,
        guests: guestCount,
        date: format(selectedDate, "yyyy-MM-dd"),
        departureTime,
        departureMarina: boat.departureMarina,
        totalPrice: estimatedTotal,
        paymentMethod,
        paymentPlan,
        amountDueNow,
        depositAmount,
        platformCommission,
        ownerPayout,
        extras: selectedExtraLabels,
        notes: specialRequests,
        queueCustomerEmail: shouldQueueCustomerEmail,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not confirm booking";
      if (message.toLowerCase().includes("no longer available") || message.toLowerCase().includes("operating hours")) {
        navigate(
          `/booking-closed?boat=${encodeURIComponent(boat.name)}&date=${encodeURIComponent(format(selectedDate, "yyyy-MM-dd"))}&reason=${encodeURIComponent("slot-unavailable")}`,
        );
        return;
      }

      toast({
        title: tl("Booking failed", "Αποτυχία κράτησης"),
        description: message,
        variant: "destructive",
      });
      return;
    }

    setWorkflowResult(result);
    trackBookingConfirmed({
      boatId: boat.id,
      boatName: boat.name,
      totalPrice: estimatedTotal,
      guests: guestCount,
      paymentMethod,
    });
    toast({
      title: tl("Booking confirmed", "Η κράτηση επιβεβαιώθηκε"),
      description: shouldQueueCustomerEmail
        ? tl(`Owner notified and confirmation email queued for ${result.customerEmail?.toEmail}. Charged now: €${amountDueNow}.`, `Ο ιδιοκτήτης ενημερώθηκε και το email επιβεβαίωσης μπήκε σε ουρά για ${result.customerEmail?.toEmail}. Χρέωση τώρα: €${amountDueNow}.`)
        : tl("Owner notified. Google sign-in booking confirmed in-app.", "Ο ιδιοκτήτης ενημερώθηκε. Η κράτηση με Google sign-in επιβεβαιώθηκε εντός εφαρμογής."),
    });

    navigate(
      `/booking-confirmed?bookingId=${encodeURIComponent(result.booking.id)}&boat=${encodeURIComponent(result.booking.boatName)}&date=${encodeURIComponent(result.booking.date)}&departure=${encodeURIComponent(result.booking.departureTime)}&amount=${encodeURIComponent(String(amountDueNow))}&emailQueued=${encodeURIComponent(String(Boolean(result.customerEmail)))}&ownerNotified=${encodeURIComponent("true")}`,
    );
  };

  const handleGoogleFastSignIn = async () => {
    try {
      await signInWithGoogle(window.location.href);
    } catch (error) {
      toast({
        title: tl("Google sign-in failed", "Αποτυχία σύνδεσης Google"),
        description: error instanceof Error ? error.message : tl("Try again or continue with email.", "Δοκίμασε ξανά ή συνέχισε με email."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative z-10 pt-16">
        <section className="border-b border-border bg-gradient-ocean py-14 md:py-18">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm mb-2">{tl("Booking", "Κράτηση")}</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              {tl("Complete your booking", "Ολοκλήρωσε την κράτησή σου")}
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              {tl("Secure your trip for", "Κλείσε την εκδρομή σου για")} {boatName} {tl("with preferred date, guest count, and contact details.", "με ημερομηνία, αριθμό επισκεπτών και στοιχεία επικοινωνίας.")}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20">
                {tl("Live package pricing", "Ζωντανή τιμολόγηση πακέτων")}
              </Badge>
              <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20">
                {tl("Fuel-sensitive estimate", "Εκτίμηση βάσει καυσίμων")}
              </Badge>
              <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20">
                {tl("Owner notification workflow", "Ροή ειδοποίησης ιδιοκτήτη")}
              </Badge>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-aegean" />
                  {tl("Booking details", "Λεπτομέρειες κράτησης")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="space-y-1">
                      <div className={`h-1 rounded-full ${step <= bookingStep ? "bg-aegean" : "bg-muted"}`} />
                      <p className={`text-xs ${step === bookingStep ? "text-foreground" : "text-muted-foreground"}`}>Step {step}</p>
                    </div>
                  ))}
                </div>

                {bookingStep === 1 ? (
                <>
                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Sector 1: Trip package</p>
                    <Badge variant="outline">Core</Badge>
                  </div>
                  <Input value={boatName} readOnly />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Choose your packet</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {packages.map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            setSelectedPackageId(pkg.id);
                            setFuelLitres([pkg.baseFuelLitres]);
                          }}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            selectedPackageId === pkg.id
                              ? "border-aegean bg-aegean/5 shadow-card"
                              : "border-border hover:border-aegean/40"
                          }`}
                        >
                          <p className="font-semibold text-foreground">{pkg.label}</p>
                          <p className="text-sm text-muted-foreground">{pkg.hours} hours</p>
                          <p className="text-xs text-muted-foreground mt-2">{pkg.vibe}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Sector 2: Trip date &amp; departure</p>
                      <p className="text-xs text-muted-foreground">Pick your trip day, a free departure time, and how many guests join.</p>
                    </div>
                    <Badge variant="outline">Schedule</Badge>
                  </div>

                  {/* Quick date shortcuts */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground shrink-0">Jump to a good option:</p>
                    {([
                      { label: "Next available", date: nextAvailableDate },
                      {
                        label: "This weekend",
                        date: (() => {
                          const today = startOfDay(new Date());
                          for (let offset = 1; offset <= 14; offset++) {
                            const d = addDays(today, offset);
                            if (isWeekend(d) && !unavailableDates.some((u) => isSameDay(u, d))) return d;
                          }
                          return undefined;
                        })(),
                      },
                      {
                        label: "+7 days",
                        date: (() => {
                          const d = addDays(startOfDay(new Date()), 7);
                          return unavailableDates.some((u) => isSameDay(u, d)) ? undefined : d;
                        })(),
                      },
                      { label: "+14 days", date: addDays(startOfDay(new Date()), 14) },
                    ] as Array<{ label: string; date: Date | undefined }>).map(({ label, date }) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!date}
                        onClick={() => {
                          if (date) {
                            setSelectedDate(date);
                            setHasDateIntent(true);
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-aegean hover:text-aegean disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {label}
                        {date ? <span className="ml-1 opacity-60">({format(date, "d MMM")})</span> : null}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-5 items-start">
                    {/* Calendar with visual unavailability */}
                    <div className="rounded-3xl border border-border p-3 md:p-4 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">Pick date</p>
                          <p className="text-xs text-muted-foreground">
                            {nextAvailableDate ? `Soonest available: ${format(nextAvailableDate, "d MMM")}` : "Chat with the owner if your date looks blocked."}
                          </p>
                        </div>
                        <p className="hidden md:block text-[11px] text-muted-foreground text-right">
                          Grey dates are in the past, red are already booked.
                        </p>
                      </div>
                      <div className="overflow-x-auto pb-1">
                        <div className="min-w-[340px] w-full flex justify-center">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              if (date) {
                                setHasDateIntent(true);
                              }
                            }}
                            disabled={(date) =>
                              date < startOfDay(new Date()) ||
                              unavailableDates.some((blocked) => isSameDay(blocked, date))
                            }
                            modifiers={{ unavailable: unavailableDates }}
                            modifiersClassNames={{ unavailable: "!text-destructive line-through !opacity-80 cursor-not-allowed" }}
                            className="rounded-2xl border border-border bg-background w-[340px] max-w-full"
                          />
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground border-t border-border">
                        <span className="flex items-center gap-1.5 pt-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
                          Selected
                        </span>
                        <span className="flex items-center gap-1.5 pt-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-accent border border-border" />
                          Today
                        </span>
                        <span className="flex items-center gap-1.5 pt-2 text-destructive/80">
                          <span className="inline-block h-3 w-3 rounded-full bg-destructive/15 border border-destructive/30" />
                          {boat ? `${(boat.owner.name || "Owner").split(' ')[0]} unavailable` : "Owner unavailable"}
                        </span>
                        <span className="flex items-center gap-1.5 pt-2 opacity-50">
                          <span className="inline-block h-3 w-3 rounded-full bg-muted border border-border" />
                          Past dates
                        </span>
                      </div>
                    </div>

                    {/* Departure time chips + guest stepper */}
                    <div className="rounded-3xl border border-border p-4 bg-muted/20 space-y-5">
                      <div className="space-y-2.5">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-aegean" />
                          Departure time
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(availableDepartureTimes.length > 0 ? availableDepartureTimes : ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]).map((slot, index) => (
                            <button
                              key={slot}
                              type="button"
                              disabled={!selectedDate || !availableDepartureTimes.includes(slot)}
                              onClick={() => setDepartureTime(slot)}
                              className={`text-xs rounded-xl border py-2 transition-colors ${
                                departureTime === slot
                                  ? "border-aegean bg-aegean/10 text-aegean font-semibold"
                                  : selectedDate && availableDepartureTimes.includes(slot)
                                    ? "border-border hover:border-aegean/50 text-muted-foreground hover:text-foreground"
                                    : "border-border text-muted-foreground/40 cursor-not-allowed"
                              }`}
                            >
                              {slot}{index === 0 && availableDepartureTimes.length > 0 ? " ★" : ""}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isLoadingDepartureTimes
                            ? "Checking free departure windows…"
                            : !selectedDate
                              ? "Choose a date first to see which departure times are free."
                              : availableDepartureTimes.length > 0
                                ? `Free starts for ${selectedPackage.hours}h trip: ${availableDepartureTimes.length}`
                                : "No valid slots for this date and package—try another day or package length."}
                        </p>
                        {liveAvailabilityNotice ? (
                          <p className="text-xs text-aegean">
                            Live availability updated just now. Times shown are refreshed in real time.
                          </p>
                        ) : null}
                        {departureRecommendations[0]?.reasons?.[0] ? (
                          <p className="text-xs text-aegean">
                            Suggested start: {departureRecommendations[0].departureTime} ({departureRecommendations[0].reasons[0]}).
                          </p>
                        ) : null}
                        {selectedPackageId === "half-day" ? (
                          <p className="text-xs text-aegean">
                            Tip: half-day slots fill quickly—pick an available time now to secure your trip.
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-aegean" />
                          Guests
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                            className="h-9 w-9 rounded-xl border border-border hover:border-aegean flex items-center justify-center text-base font-semibold transition-colors"
                            aria-label="Remove guest"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold tabular-nums text-foreground">{guestCount}</span>
                          <button
                            type="button"
                            onClick={() => setGuestCount((c) => Math.min(boat?.capacity ?? 12, c + 1))}
                            className="h-9 w-9 rounded-xl border border-border hover:border-aegean flex items-center justify-center text-base font-semibold transition-colors"
                            aria-label="Add guest"
                          >
                            +
                          </button>
                          <span className="text-xs text-muted-foreground">/ {boat?.capacity ?? 12} max</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className={`rounded-2xl border p-4 transition-all duration-300 ${
                    selectedDate ? "border-aegean/30 bg-aegean/5" : "border-dashed border-border bg-muted/20"
                  }`}>
                    {selectedDate ? (
                      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
                        <div className="flex items-center gap-2">
                          <CalendarCheck2 className="h-4 w-4 text-aegean shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
                            <p className="text-sm font-semibold text-foreground">{format(selectedDate, "EEEE, d MMM yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-aegean shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departure</p>
                            <p className="text-sm font-semibold text-foreground">
                              {departureTime
                                ? `${departureTime} · ${boat?.departureMarina ?? "marina"}`
                                : "Select a departure time"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-aegean shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Guests</p>
                            <p className="text-sm font-semibold text-foreground">{guestCount}</p>
                          </div>
                        </div>
                        {departureTime ? (
                          <div className="flex items-center gap-2 sm:ml-auto">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. return</p>
                              <p className="text-sm font-semibold text-foreground">
                                {(() => {
                                  const [h, m] = departureTime.split(":").map(Number);
                                  const dep = new Date(selectedDate);
                                  dep.setHours(h, m, 0, 0);
                                  return format(addHours(dep, selectedPackage.hours), "HH:mm");
                                })()}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-1">Choose a date and departure time above to see your schedule</p>
                    )}
                  </div>
                </div>
                </>
                ) : null}

                {bookingStep === 2 ? (
                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Sector 3: Customer details</p>
                    <Badge variant="outline">Identity</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                    <Input type="email" placeholder="Email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                  </div>
                  {!sessionUser ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">Fast checkout sign-in</p>
                      <p className="text-xs text-muted-foreground">Use email only or continue with Google in one tap.</p>
                      <Button type="button" variant="outline" className="w-full" onClick={handleGoogleFastSignIn}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Continue with Google
                      </Button>
                    </div>
                  ) : null}
                </div>
                ) : null}

                {bookingStep === 2 ? (
                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Sector 4: Experience and add-ons</p>
                    <Badge variant="outline">Custom</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {showFuelEstimate ? (
                    <div className="space-y-3 rounded-2xl border border-aegean/20 bg-aegean/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-aegean" />
                          Fuel estimate
                        </p>
                        <p className="text-sm font-semibold text-foreground">{fuelLitres[0]} L</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[Math.max(20, suggestedFuelLitres - 12), suggestedFuelLitres, Math.min(120, suggestedFuelLitres + 12)].map((litres) => (
                          <Button
                            key={`fuel-${litres}`}
                            type="button"
                            variant={fuelLitres[0] === litres ? "default" : "outline"}
                            className="h-8 text-xs"
                            onClick={() => setFuelLitres([litres])}
                          >
                            {litres}L
                          </Button>
                        ))}
                      </div>

                      <Slider
                        value={fuelLitres}
                        min={10}
                        max={120}
                        step={2}
                        onValueChange={setFuelLitres}
                      />

                      <div className="rounded-xl border border-border bg-background p-3">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Estimated fuel cost</p>
                        <p className="text-lg font-semibold text-foreground">€{fuelCost}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Live rate: €{fuelPricePerLitre.toFixed(2)}/L. Adjust based on route and sea conditions.
                        </p>
                      </div>
                    </div>
                    ) : (
                      <div className="rounded-2xl border border-border p-4 bg-muted/30 text-sm text-muted-foreground">
                        Fuel estimate is included in skipper-led trips and is not shown separately.
                      </div>
                    )}

                    <div className="space-y-4 rounded-2xl border border-border p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Include skipper</p>
                          <p className="text-xs text-muted-foreground">
                            {boat?.skipperRequired
                              ? "Required by this boat owner"
                              : "Professional captain for smoother routing"}
                          </p>
                        </div>
                        <Switch checked={includeSkipper} onCheckedChange={setIncludeSkipper} disabled={boat?.skipperRequired} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Flexible cancellation</p>
                          <p className="text-xs text-muted-foreground">Extra protection if weather or timing shifts</p>
                        </div>
                        <Switch checked={includeFlexibleCancellation} onCheckedChange={setIncludeFlexibleCancellation} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-aegean" />
                      Owner upgrades
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ownerUpgrades.map((extra) => {
                        const selected = selectedExtras.includes(extra.id);

                        return (
                          <button
                            key={extra.id}
                            type="button"
                            onClick={() => toggleExtra(extra.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              selected
                                ? "border-aegean bg-aegean/5 shadow-card"
                                : "border-border hover:border-aegean/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-foreground">{extra.label}</p>
                              <span className="text-sm text-aegean">+€{extra.price}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {ownerUpgrades.length === 0 ? (
                      <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border p-3">
                        No owner upgrades added for this boat yet.
                      </p>
                    ) : null}
                  </div>

                  <Textarea placeholder="Special requests (optional)" value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} />
                </div>
                ) : null}

                {bookingStep === 3 ? (
                  <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Sector 5: Payment setup</p>
                      <Badge variant="outline">Payment</Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Choose payment method</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {paymentMethodOptions.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(method.id);
                              if (!paymentPlan) {
                                setPaymentPlan("deposit");
                              }
                            }}
                            className={`rounded-xl border px-3 py-2 text-sm text-left transition-colors ${
                              paymentMethod === method.id
                                ? "border-aegean bg-aegean/10 text-aegean"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <p className="font-medium">{method.label}</p>
                            <p className="text-xs opacity-80">{method.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Choose payment plan</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentPlan("deposit")}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                              paymentPlan === "deposit"
                                ? "border-aegean bg-aegean/10 text-aegean"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            30% deposit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentPlan("full")}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                              paymentPlan === "full"
                                ? "border-aegean bg-aegean/10 text-aegean"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Pay full now
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {paymentMethod === "stripe" ? (
                      <div className="rounded-2xl border border-aegean/30 bg-aegean/5 p-3">
                        <p className="text-sm font-medium text-foreground">Stripe Checkout</p>
                        <p className="text-xs text-muted-foreground mt-1">You'll be redirected to secure Stripe Checkout where you can pay with card, Apple Pay, Google Pay, or other methods.</p>
                      </div>
                    ) : null}

                    <div className="rounded-xl border border-aegean/30 bg-aegean/5 p-3">
                      <p className="text-xs text-muted-foreground">Due now</p>
                      <p className="text-lg font-semibold text-foreground">€{amountDueNow}</p>
                      <p className="text-xs text-muted-foreground">
                        {paymentPlan === "deposit"
                          ? `Remaining at harbor: €${Math.max(estimatedTotal - depositAmount, 0)}`
                          : "No remaining balance at harbor."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {bookingStep === 4 ? (
                  <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Sector 6: Review and confirm</p>
                      <Badge variant="outline">Final step</Badge>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Boat</span>
                        <span className="text-foreground font-medium">{boatName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Package</span>
                        <span className="text-foreground font-medium">{selectedPackage.label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-foreground font-medium">{selectedDate ? format(selectedDate, "d MMM yyyy") : "Pick a date"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Departure</span>
                        <span className="text-foreground font-medium">{departureTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Guests</span>
                        <span className="text-foreground font-medium">{guestCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Due now</span>
                        <span className="text-foreground font-semibold">€{amountDueNow}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Review your trip details and payment on the right panel, then click confirm.
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4) : current))}
                    disabled={bookingStep === 1}
                  >
                    Back
                  </Button>

                  {bookingStep === 1 ? (
                    <Button type="button" onClick={() => setBookingStep(2)} disabled={!canContinueStep1} className="bg-gradient-accent text-accent-foreground">
                      Continue
                    </Button>
                  ) : null}
                  {bookingStep === 2 ? (
                    <Button type="button" onClick={() => setBookingStep(3)} disabled={!canContinueStep2} className="bg-gradient-accent text-accent-foreground">
                      Continue
                    </Button>
                  ) : null}
                  {bookingStep === 3 ? (
                    <Button type="button" onClick={() => setBookingStep(4)} disabled={!canContinueStep3} className="bg-gradient-accent text-accent-foreground">
                      Continue
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {boat ? (
              <div className="space-y-6 lg:col-span-1">
                <Card className="shadow-card h-fit">
                  <CardHeader>
                    <CardTitle>Meet your host</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className="bg-aegean/10 text-aegean font-semibold">
                          {(boat.owner.name || "Owner")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{boat.owner.name || "Owner"}</p>
                          {boat.owner.isSuperhost ? <Badge className="bg-aegean text-primary-foreground">Guest favorite</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{boat.owner.title || "Boat Owner"}</p>
                      </div>
                    </div>
                    {boat.owner.bio ? <p className="text-sm text-muted-foreground">{boat.owner.bio}</p> : null}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
                      <div className="rounded-2xl border border-border p-3">
                        <p className="text-xs text-muted-foreground">Trips</p>
                        <p className="font-semibold text-foreground">{boat.owner.tripsHosted}</p>
                      </div>
                      <div className="rounded-2xl border border-border p-3">
                        <p className="text-xs text-muted-foreground">Response</p>
                        <p className="font-semibold text-foreground">{boat.owner.responseRate}%</p>
                      </div>
                      <div className="rounded-2xl border border-border p-3">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="font-semibold text-foreground flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{boat.rating}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingStep === 4 ? (
                <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Step 1: Review trip cost</p>
                  <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">{selectedPackage.label}</span><span className="text-foreground">€{basePackagePrice}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel ({fuelLitres[0]}L)</span><span className="text-foreground">€{fuelCost}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Skipper</span><span className="text-foreground">€{skipperCost}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Guest experience uplift</span><span className="text-foreground">€{guestExperienceFee}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Flexible cancellation</span><span className="text-foreground">€{flexibleCancellationCost}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Sea routing fee</span><span className="text-foreground">€{crazySeaRoutingFee}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Add-ons</span><span className="text-foreground">€{extrasCost}</span></div>
                  </div>
                </div>
                ) : null}

                {bookingStep === 4 ? (
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm font-semibold text-foreground">Step 2: Estimated total</p>
                  <p className="text-sm text-muted-foreground">Estimated total</p>
                  <p className="text-3xl font-heading font-bold text-foreground">€{estimatedTotal}</p>
                </div>
                ) : null}

                <p className="text-xs text-muted-foreground">Step 3: Your payment goes through Stripe Checkout. Platform retains 20% commission, 80% goes directly to boat owner.</p>

                {bookingStep === 4 ? (
                <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2 text-sm">
                  <p className="text-sm font-semibold text-foreground">Step 4: Booking snapshot</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Boat</span>
                    <span className="text-foreground font-medium">{boatName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Day</span>
                    <span className="text-foreground font-medium">{selectedDate ? format(selectedDate, "d MMM yyyy") : "Pick a date"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="text-foreground font-medium">{departureTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="text-foreground font-medium">{paymentMethod === "stripe" ? "Stripe Checkout" : paymentMethod === "manual" ? "Choose payment plan" : "Choose method"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Payment plan</span>
                    <span className="text-foreground font-medium">{paymentPlan === "deposit" ? "30% deposit" : paymentPlan === "full" ? "Pay full now" : "Choose plan"}</span>
                  </div>
                </div>
                ) : null}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-aegean" />
                  Secure checkout and verified owner
                </p>

                {bookingStep === 4 && paymentPlan === "deposit" ? (
                  <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive">
                      Deposit is non-refundable after 48 hours from booking confirmation.
                    </p>
                  </div>
                ) : null}

                {bookingStep === 4 ? <p className="text-xs text-muted-foreground">Step 8: Confirm and send booking workflow.</p> : null}
                {bookingStep === 4 ? (
                <Button className="w-full bg-gradient-accent text-accent-foreground gap-2" onClick={handleConfirmBooking}>
                  <CreditCard className="h-4 w-4" />
                  Confirm booking (€{amountDueNow} now)
                </Button>
                ) : null}
                <Button asChild variant="outline" className="w-full">
                  <Link to={boatProfileLink}>Back to boat profile</Link>
                </Button>

                {workflowResult ? (
                  <div className="rounded-2xl border border-aegean/30 bg-aegean/5 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-aegean/15 p-2 text-aegean">
                        <CalendarCheck2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Booking workflow completed</p>
                        <p className="text-sm text-muted-foreground">Reference {workflowResult.booking.id}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="rounded-2xl border border-border bg-background p-3">
                        <p className="font-medium text-foreground">Owner notification</p>
                        <p className="text-muted-foreground mt-1">{workflowResult.ownerNotification.subject}</p>
                        <p className="text-xs text-muted-foreground mt-2">Queued to {workflowResult.ownerNotification.ownerEmail}</p>
                      </div>

                      {workflowResult.customerEmail ? (
                        <div className="rounded-2xl border border-border bg-background p-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-aegean" />
                            <p className="font-medium text-foreground">Customer confirmation email</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">To: {workflowResult.customerEmail.toEmail}</p>
                          <p className="text-xs text-muted-foreground">Subject: {workflowResult.customerEmail.subject}</p>
                          <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground font-sans">{workflowResult.customerEmail.body}</pre>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-border bg-background p-3 space-y-1">
                          <p className="font-medium text-foreground">In-app confirmation</p>
                          <p className="text-xs text-muted-foreground">
                            Email queue skipped for Google sign-in booking. Confirmation is available in your profile and booking record.
                          </p>
                        </div>
                      )}

                      <Button asChild variant="outline" className="w-full">
                        <Link
                          to={`/post-trip-review?bookingId=${encodeURIComponent(workflowResult.booking.id)}&boatRef=${encodeURIComponent(boat?.publicSlug || (boat ? buildBoatPublicSlug(boat) : workflowResult.booking.boatId))}&boat=${encodeURIComponent(workflowResult.booking.boatName)}`}
                        >
                          Post trip review
                        </Link>
                      </Button>
                      {boat ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link to={`/chat?boatRef=${encodeURIComponent(boat.publicSlug || buildBoatPublicSlug(boat))}&boat=${encodeURIComponent(boat.name)}`}>
                            <MessageCircle className="mr-2 h-4 w-4" />{tl("Chat with owner", "Συνομιλία με ιδιοκτήτη")}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="relative z-0 shadow-card h-fit overflow-hidden">
              <div className="relative z-0 aspect-[4/3] border-b border-border overflow-hidden">
                <BoatLocationMap
                  points={[
                    {
                      id: boat.id,
                      name: boat.name,
                      query: boat.mapQuery,
                      subtitle: `${boat.departureMarina} • ${boat.location}`,
                    },
                  ]}
                  selectedPointId={boat.id}
                  emptyLabel="Meeting point map is unavailable."
                  loadingLabel="Loading meeting point map…"
                  heightClassName="h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>Meeting point</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">{boat.departureMarina}</p>
                  <p className="text-sm text-muted-foreground">{boat.location}, Greece</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button asChild className="bg-gradient-accent text-accent-foreground">
                    <a href={googleDirectionsUrl} target="_blank" rel="noreferrer">
                      <Navigation className="mr-2 h-4 w-4" />
                      Open directions
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
