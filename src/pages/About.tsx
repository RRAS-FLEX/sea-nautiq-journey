import { Anchor, HeartHandshake, ShieldCheck, Waves, Compass, CalendarClock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const values = [
  {
    icon: ShieldCheck,
    title: { en: "Trust & Safety", el: "Εμπιστοσύνη & Ασφάλεια" },
    description: {
      en: "We prioritize verified owners, clear listing standards, and transparent booking details.",
      el: "Δίνουμε προτεραιότητα σε επαληθευμένους ιδιοκτήτες, σαφή standards καταχώρισης και διαφανείς λεπτομέρειες κράτησης.",
    },
  },
  {
    icon: Waves,
    title: { en: "Sea-First Experiences", el: "Εμπειρίες με επίκεντρο τη Θάλασσα" },
    description: {
      en: "Every product decision is designed to make sea trips easier to plan and enjoy.",
      el: "Κάθε απόφαση προϊόντος σχεδιάζεται ώστε τα θαλάσσια ταξίδια να οργανώνονται και να απολαμβάνονται πιο εύκολα.",
    },
  },
  {
    icon: HeartHandshake,
    title: { en: "Owner Partnership", el: "Συνεργασία με Ιδιοκτήτες" },
    description: {
      en: "We help local owners grow with fair visibility and practical fleet tools.",
      el: "Βοηθάμε τους τοπικούς ιδιοκτήτες να αναπτυχθούν με δίκαιη προβολή και πρακτικά εργαλεία στόλου.",
    },
  },
];

const impactStats = [
  { label: { en: "Boats listed", el: "Καταχωρημένα σκάφη" }, value: "100+", icon: Anchor },
  { label: { en: "Greek destinations", el: "Ελληνικοί προορισμοί" }, value: "4", icon: Compass },
  { label: { en: "Average rating", el: "Μέση βαθμολογία" }, value: "4.8", icon: Waves },
  { label: { en: "Faster booking flow", el: "Ταχύτερη κράτηση" }, value: "~2 min", icon: CalendarClock },
];

const faqs = [
  {
    question: {
      en: "How does Nautiq verify boats and owners?",
      el: "Πώς επαληθεύει το Nautiq τα σκάφη και τους ιδιοκτήτες;",
    },
    answer: {
      en: "Listings are reviewed before going live, and owner profiles include identity and listing quality checks.",
      el: "Οι καταχωρίσεις ελέγχονται πριν δημοσιευτούν και τα προφίλ ιδιοκτητών περιλαμβάνουν ελέγχους ταυτότητας και ποιότητας καταχώρισης.",
    },
  },
  {
    question: {
      en: "Can I book with or without a skipper?",
      el: "Μπορώ να κάνω κράτηση με ή χωρίς skipper;",
    },
    answer: {
      en: "It depends on the boat listing and local regulations. Each listing clearly indicates skipper requirements.",
      el: "Εξαρτάται από την καταχώριση του σκάφους και τους τοπικούς κανονισμούς. Κάθε καταχώριση δείχνει ξεκάθαρα αν απαιτείται skipper.",
    },
  },
  {
    question: {
      en: "Is Nautiq focused only on Greece?",
      el: "Το Nautiq επικεντρώνεται μόνο στην Ελλάδα;",
    },
    answer: {
      en: "Today we focus on Greek destinations to ensure quality. We plan to expand to more Mediterranean regions next.",
      el: "Σήμερα επικεντρωνόμαστε σε ελληνικούς προορισμούς για να διασφαλίζουμε ποιότητα. Σχεδιάζουμε επέκταση και σε άλλες περιοχές της Μεσογείου.",
    },
  },
];

const About = () => {
  const { tl } = useLanguage();
  useSEO({
    title: "About Nautiq — Greece's Trusted Boat Rental Platform",
    description: "Learn how Nautiq connects travelers with verified boat owners across the Greek islands. Our mission: make sea experiences accessible, safe, and unforgettable.",
    canonical: "https://nautiq.gr/about",
    keywords: "about Nautiq, boat rental platform Greece, trusted boat owners, Greek sea experiences",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-border bg-gradient-ocean py-16 md:py-20">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm mb-3">{tl("About Nautiq", "Σχετικά με το Nautiq")}</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              {tl("Building the easiest way to book sea experiences", "Χτίζουμε τον πιο εύκολο τρόπο κράτησης θαλάσσιων εμπειριών")}
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              {tl(
                "Nautiq connects travelers and trusted boat owners with a booking experience built around clarity, speed, and confidence.",
                "Το Nautiq συνδέει ταξιδιώτες και αξιόπιστους ιδιοκτήτες σκαφών με εμπειρία κράτησης βασισμένη στη σαφήνεια, την ταχύτητα και την εμπιστοσύνη.",
              )}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-4xl">
              {impactStats.map((item) => (
                <div key={item.label.en} className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
                  <item.icon className="h-4 w-4 text-primary-foreground/80 mb-2" />
                  <p className="text-2xl font-heading font-bold text-primary-foreground">{item.value}</p>
                  <p className="text-xs text-primary-foreground/75">{tl(item.label.en, item.label.el)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card-hover">
              <CardHeader>
                <CardTitle>{tl("Our Mission", "Η Αποστολή μας")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  {tl(
                    "We created Nautiq to simplify sea travel planning for customers and create dependable demand for local boat owners.",
                    "Δημιουργήσαμε το Nautiq για να απλοποιήσουμε τον σχεδιασμό θαλάσσιων ταξιδιών για πελάτες και να δημιουργήσουμε σταθερή ζήτηση για τοπικούς ιδιοκτήτες.",
                  )}
                </p>
                <p>
                  {tl(
                    "Our platform reduces booking friction with practical filters, clear listings, and profile-led trust signals so users can choose faster.",
                    "Η πλατφόρμα μας μειώνει τη δυσκολία κράτησης με πρακτικά φίλτρα, σαφείς καταχωρίσεις και σήματα εμπιστοσύνης ώστε οι χρήστες να αποφασίζουν πιο γρήγορα.",
                  )}
                </p>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-foreground font-medium mb-1">{tl("What we optimize", "Τι βελτιστοποιούμε")}</p>
                  <p className="text-sm">{tl("High-intent demand matching, trusted owner visibility, and clearer package choices based on real booking performance.", "Στοχευμένη αντιστοίχιση ζήτησης, αξιόπιστη προβολή ιδιοκτητών και πιο ξεκάθαρες επιλογές πακέτων βάσει πραγματικής απόδοσης κρατήσεων.")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{tl("At a Glance", "Με μια Ματιά")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />{tl("102 boats listed", "102 καταχωρημένα σκάφη")}</p>
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />{tl("4 key destinations", "4 βασικοί προορισμοί")}</p>
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />{tl("4.8+ avg trip rating", "4.8+ μέση βαθμολογία εκδρομών")}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-10 md:pb-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title.en} className="shadow-card">
                <CardContent className="pt-6 space-y-3">
                  <value.icon className="h-6 w-6 text-aegean" />
                  <h3 className="text-lg font-heading font-semibold text-foreground">{tl(value.title.en, value.title.el)}</h3>
                  <p className="text-sm text-muted-foreground">{tl(value.description.en, value.description.el)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-14 md:pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>{tl("Frequently Asked Questions", "Συχνές Ερωτήσεις")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={faq.question.en}>
                      <AccordionTrigger>{tl(faq.question.en, faq.question.el)}</AccordionTrigger>
                      <AccordionContent>{tl(faq.answer.en, faq.answer.el)}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
