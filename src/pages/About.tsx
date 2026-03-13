import { Anchor, HeartHandshake, ShieldCheck, Waves } from "lucide-react";
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

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    description: "We prioritize verified owners, clear listing standards, and transparent booking details.",
  },
  {
    icon: Waves,
    title: "Sea-First Experiences",
    description: "Every product decision is designed to make sea trips easier to plan and enjoy.",
  },
  {
    icon: HeartHandshake,
    title: "Owner Partnership",
    description: "We help local owners grow with fair visibility and practical fleet tools.",
  },
];

const faqs = [
  {
    question: "How does Nautiq verify boats and owners?",
    answer:
      "Listings are reviewed before going live, and owner profiles include identity and listing quality checks.",
  },
  {
    question: "Can I book with or without a skipper?",
    answer:
      "It depends on the boat listing and local regulations. Each listing clearly indicates skipper requirements.",
  },
  {
    question: "Is Nautiq focused only on Greece?",
    answer:
      "Today we focus on Greek destinations to ensure quality. We plan to expand to more Mediterranean regions next.",
  },
];

const About = () => {
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
            <p className="text-primary-foreground/80 text-sm mb-3">About Nautiq</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              Building the easiest way to book sea experiences
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              Nautiq connects travelers and trusted boat owners with a booking experience built around clarity, speed, and confidence.
            </p>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card-hover">
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We created Nautiq to simplify sea travel planning for customers and create dependable demand for local boat owners.
                </p>
                <p>
                  Our platform reduces booking friction with practical filters, clear listings, and profile-led trust signals so users can choose faster.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>At a Glance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />102 boats listed</p>
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />4 key destinations</p>
                <p className="flex items-center gap-2"><Anchor className="h-4 w-4 text-aegean" />4.8+ avg trip rating</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-10 md:pb-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="shadow-card">
                <CardContent className="pt-6 space-y-3">
                  <value.icon className="h-6 w-6 text-aegean" />
                  <h3 className="text-lg font-heading font-semibold text-foreground">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-14 md:pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={faq.question}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
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
