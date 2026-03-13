import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { CalendarCheck2, CalendarDays, CreditCard, Fuel, LogIn, Mail, MapPin, Navigation, ShieldCheck, Sparkles, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { confirmBookingWorkflow, type ConfirmBookingResult } from "@/lib/booking-workflow";
import { getBoats } from "@/lib/boats";
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

type PaymentMethod = "stripe" | "card" | "apple_pay" | "google_pay" | "manual";

const paymentMethodOptions: Array<{ id: PaymentMethod; label: string; description: string }> = [
  { id: "stripe", label: "Stripe", description: "Secure hosted checkout" },
  { id: "card", label: "Credit/Debit Card", description: "Pay directly with card" },
  { id: "apple_pay", label: "Apple Pay", description: "Wallet checkout" },
  { id: "google_pay", label: "Google Pay", description: "Wallet checkout" },
  { id: "manual", label: "Pay at harbor", description: "Reserve now, pay in person" },
];

const Booking = () => {
  const [searchParams] = useSearchParams();
  const { user: sessionUser } = useCurrentUser();
  const { toast } = useToast();
  const { tl } = useLanguage();
  const boatId = searchParams.get("boatId");
  const boatNameFromQuery = searchParams.get("boat") ?? "Selected boat";
  const [allBoats, setAllBoats] = useState<Boat[]>([]);

  useEffect(() => {
    getBoats().then(setAllBoats).catch(() => setAllBoats([]));
  }, []);

  const boat = allBoats.find((entry) => entry.id === boatId) ?? allBoats.find((entry) => entry.name === boatNameFromQuery);
  const boatName = boat?.name ?? boatNameFromQuery;
  const dailyRate = boat?.pricePerDay ?? 450;
  const [selectedPackageId, setSelectedPackageId] = useState<(typeof packages)[number]["id"]>("half-day");
  const [fuelLitres, setFuelLitres] = useState([40]);
  const [guestCount, setGuestCount] = useState(4);
  const [includeSkipper, setIncludeSkipper] = useState(true);
  const [includeFlexibleCancellation, setIncludeFlexibleCancellation] = useState(false);
  const [ownerUpgrades, setOwnerUpgrades] = useState<Array<{ id: string; label: string; price: number }>>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(startOfDay(new Date()), 3));
  const [departureTime, setDepartureTime] = useState("10:00");
  const [customerName, setCustomerName] = useState(sessionUser?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(sessionUser?.email ?? "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [workflowResult, setWorkflowResult] = useState<ConfirmBookingResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<"deposit" | "full" | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;

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

      const { data, error } = await (supabase as any)
        .from("owner_package_boats")
        .select("package_id, owner_packages(name, price)")
        .eq("boat_id", boat.id);

      if (error || !Array.isArray(data)) {
        setOwnerUpgrades([]);
        return;
      }

      const mapped = data
        .filter((row: any) => row.owner_packages?.name)
        .map((row: any) => ({
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
  const fuelCost = Math.round(fuelLitres[0] * fuelPricePerLitre);
  const skipperCost = includeSkipper ? Math.round(selectedPackage.hours * 28) : 0;
  const guestExperienceFee = Math.max(guestCount - 4, 0) * 18;
  const flexibleCancellationCost = includeFlexibleCancellation ? Math.round(basePackagePrice * 0.12) : 0;
  const extrasCost = ownerUpgrades
    .filter((item) => selectedExtras.includes(item.id))
    .reduce((total, item) => total + item.price, 0);
  const crazySeaRoutingFee = selectedPackageId === "full-day" ? 95 : 0;
  const suggestedFuelLitres = Math.min(120, selectedPackage.baseFuelLitres + Math.max(guestCount - 4, 0) * 2);
  const unavailableDates = useMemo(
    () => boat?.availability.unavailableDates.map((date) => parseISO(date)) ?? [],
    [boat],
  );
  const nextAvailableDate = useMemo(() => {
    return Array.from({ length: 21 }, (_, index) => addDays(startOfDay(new Date()), index)).find(
      (date) => !unavailableDates.some((blockedDate) => isSameDay(blockedDate, date)),
    );
  }, [unavailableDates]);
  const boatProfileLink = boat ? `/boats/${boat.id}` : "/boats";
  const mapQuery = boat ? encodeURIComponent(boat.mapQuery) : "";
  const googleMapsUrl = boat ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : "/boats";
  const googleDirectionsUrl = boat ? `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}` : "/boats";

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

  const selectedExtraLabels = useMemo(
    () => ownerUpgrades.filter((item) => selectedExtras.includes(item.id)).map((item) => item.label),
    [selectedExtras, ownerUpgrades],
  );

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
        description: tl("Open the boat profile again and retry the booking.", "Άνοιξε ξανά το προφίλ του σκάφους και δοκίμασε ξανά την κράτηση."),
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

    if (paymentMethod !== "manual" && (!cardholderName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim())) {
      toast({
        title: tl("Card details required", "Απαιτούνται στοιχεία κάρτας"),
        description: tl("Complete card details to continue with online payment.", "Συμπλήρωσε τα στοιχεία κάρτας για να συνεχίσεις με online πληρωμή."),
        variant: "destructive",
      });
      return;
    }

    const shouldQueueCustomerEmail = customerEmail.trim().length > 0;
    const result = await confirmBookingWorkflow({
      boatId: boat.id,
      boatName: boat.name,
      ownerName: boat.owner.name,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      packageLabel: selectedPackage.label,
      guests: guestCount,
      date: selectedDate.toISOString().slice(0, 10),
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
      notes: paymentMethod === "manual" ? specialRequests : `${specialRequests}\nPayment card holder: ${cardholderName.trim()}`.trim(),
      queueCustomerEmail: shouldQueueCustomerEmail,
    });

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

    if (paymentMethod === "stripe" && stripePaymentLink) {
      window.open(stripePaymentLink, "_blank", "noopener,noreferrer");
    }
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

      <main className="pt-16">
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

                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Sector 2: Date and departure</p>
                    <Badge variant="outline">Schedule</Badge>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                    <div className="rounded-3xl border border-border p-4 bg-muted/20">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-medium text-foreground">Check calendar</p>
                        <p className="text-xs text-muted-foreground">
                          {nextAvailableDate ? `Next open: ${format(nextAvailableDate, "d MMM")}` : "Ask owner"}
                        </p>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) =>
                          date < startOfDay(new Date()) || unavailableDates.some((blockedDate) => isSameDay(blockedDate, date))
                        }
                        className="rounded-2xl border border-border bg-background"
                      />
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                        {unavailableDates.slice(0, 4).map((date) => (
                          <Badge key={date.toISOString()} variant="outline">
                            Unavailable {format(date, "d MMM")}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="time"
                          value={departureTime}
                          onChange={(event) => setDepartureTime(event.target.value)}
                        />
                        <Input type="number" min={1} placeholder="Guests" value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value || 1))} />
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">Selected departure</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : "Choose a date from the calendar"}
                        </p>
                        <p className="text-xs text-muted-foreground">Departure time {departureTime} from {boat?.departureMarina ?? "the marina"}</p>
                      </div>
                    </div>
                  </div>
                </div>

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

                <div className="rounded-2xl border border-border p-4 bg-muted/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Sector 4: Experience and add-ons</p>
                    <Badge variant="outline">Custom</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-aegean" />
                          Fuel estimate
                        </p>
                        <p className="text-sm text-muted-foreground">{fuelLitres[0]} L</p>
                      </div>
                      <Slider
                        value={fuelLitres}
                        min={10}
                        max={120}
                        step={2}
                        onValueChange={setFuelLitres}
                      />
                      <Button type="button" size="sm" variant="outline" onClick={() => setFuelLitres([suggestedFuelLitres])}>
                        Use suggested fuel ({suggestedFuelLitres}L)
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Fuel is calculated live at €{fuelPricePerLitre.toFixed(2)} per litre based on the trip's estimated routing.
                      </p>
                    </div>

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
              </CardContent>
            </Card>

            <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle>Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm font-semibold text-foreground">Step 2: Estimated total</p>
                  <p className="text-sm text-muted-foreground">Estimated total</p>
                  <p className="text-3xl font-heading font-bold text-foreground">€{estimatedTotal}</p>
                </div>

                <p className="text-xs text-muted-foreground">Step 3: Fixed customer price. Platform settles 15% from owner payout after booking.</p>

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
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-aegean" />
                  Secure checkout and verified owner
                </p>

                <div className="rounded-2xl border border-border bg-muted/10 p-3 space-y-2 transition-all duration-300">
                  <p className="text-sm font-semibold text-foreground">Step 5: Choose payment method</p>
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
                  <p className="text-xs text-muted-foreground">
                    {paymentMethod === "stripe"
                      ? stripePaymentLink
                        ? "Stripe checkout opens in a new tab after confirmation."
                        : "Add VITE_STRIPE_PAYMENT_LINK to enable Stripe checkout redirection."
                      : paymentMethod === "manual"
                        ? "Manual harbor payment keeps your booking reserved without online charge."
                        : "Card or wallet checkout will be processed after confirmation."}
                  </p>
                </div>

                {paymentMethod ? (
                <div className="rounded-2xl border border-border bg-muted/10 p-3 space-y-2 transition-all duration-300 animate-in fade-in-50">
                  <p className="text-sm font-semibold text-foreground">Step 6: Choose payment plan</p>
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

                {paymentMethod && paymentMethod !== "manual" ? (
                  <div className="rounded-2xl border border-border bg-muted/10 p-3 space-y-3 transition-all duration-300 animate-in fade-in-50">
                    <p className="text-sm font-semibold text-foreground">Step 7: Add card details</p>
                    <Input placeholder="Card holder name" value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} />
                    <Input placeholder="Card number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="MM/YY" value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} />
                      <Input placeholder="CVC" value={cardCvc} onChange={(event) => setCardCvc(event.target.value)} />
                    </div>
                  </div>
                ) : null}

                <p className="text-xs text-muted-foreground">Step 8: Confirm and send booking workflow.</p>
                <Button className="w-full bg-gradient-accent text-accent-foreground gap-2" onClick={handleConfirmBooking}>
                  <CreditCard className="h-4 w-4" />
                  Confirm booking (€{amountDueNow} now)
                </Button>
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
                          to={`/post-trip-review?bookingId=${encodeURIComponent(workflowResult.booking.id)}&boatId=${encodeURIComponent(workflowResult.booking.boatId)}&boat=${encodeURIComponent(workflowResult.booking.boatName)}`}
                        >
                          Post trip review
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {boat ? (
              <>
                <Card className="shadow-card h-fit">
                  <CardHeader>
                    <CardTitle>Meet your host</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className="bg-aegean/10 text-aegean font-semibold">
                          {boat.owner.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{boat.owner.name}</p>
                          {boat.owner.isSuperhost ? <Badge className="bg-aegean text-primary-foreground">Guest favorite</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{boat.owner.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{boat.owner.bio}</p>
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
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/contact-owner?boatId=${encodeURIComponent(boat.id)}&boat=${encodeURIComponent(boat.name)}`}>Ask host a question</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-card h-fit overflow-hidden">
                  <div className="aspect-[4/3] border-b border-border">
                    <iframe
                      title={`Meeting point for ${boat.name}`}
                      src={`https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
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
                          Navigate with Google Maps
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                          <MapPin className="mr-2 h-4 w-4" />
                          Open location
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
