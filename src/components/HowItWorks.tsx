import { Search, CalendarCheck, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const stepConfig = [
  {
    icon: Search,
    titleKey: "how.step1.title",
    descriptionKey: "how.step1.desc",
  },
  {
    icon: CalendarCheck,
    titleKey: "how.step2.title",
    descriptionKey: "how.step2.desc",
  },
  {
    icon: Waves,
    titleKey: "how.step3.title",
    descriptionKey: "how.step3.desc",
  },
];

const HowItWorks = () => {
  const { t } = useLanguage();
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t("how.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("how.subtitle")}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t("how.badge.owners")}</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t("how.badge.pricing")}</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t("how.badge.fast")}</span>
          </div>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="hidden md:block absolute left-0 right-0 top-9 h-px bg-border" />
          {stepConfig.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mx-auto mb-5">
                <step.icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="text-sm font-semibold text-aegean mb-2">{t("how.step", { step: i + 1 })}</div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-muted-foreground">{t(step.descriptionKey)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-10 text-center"
        >
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to="/boats">{t("hero.advancedFinder")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
