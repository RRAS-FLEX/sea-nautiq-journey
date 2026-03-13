import { Anchor, TrendingUp, Calendar, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const benefits = [
  { icon: Globe, key: "ownerCta.benefit1" },
  { icon: TrendingUp, key: "ownerCta.benefit2" },
  { icon: Calendar, key: "ownerCta.benefit3" },
];

const OwnerCTA = () => {
  const { t } = useLanguage();
  return (
    <section className="py-20 md:py-28 bg-gradient-ocean relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-aegean/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-turquoise/10 translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 rounded-2xl bg-turquoise/20 flex items-center justify-center mx-auto mb-6">
              <Anchor className="h-7 w-7 text-turquoise" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
              {t("ownerCta.title")}
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8">
              {t("ownerCta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              {benefits.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center gap-2 text-primary-foreground/80 text-sm"
                >
                  <b.icon className="h-4 w-4 text-turquoise" />
                  {t(b.key)}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-turquoise text-accent-foreground rounded-full px-8 text-base font-semibold hover:bg-turquoise/90"
              >
                <Link to="/become-owner">{t("ownerCta.cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10">
                <Link to="/about">{t("nav.helpSupport")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OwnerCTA;
