import { Search, CalendarCheck, Waves } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Search,
    title: "Find a Boat",
    description: "Browse available boats near your destination.",
  },
  {
    icon: CalendarCheck,
    title: "Book in Seconds",
    description: "Choose your date and secure your reservation.",
  },
  {
    icon: Waves,
    title: "Enjoy the Sea",
    description: "Meet your captain or drive the boat yourself.",
  },
];

const HowItWorks = () => {
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
            How Nautiq Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Three simple steps to your perfect sea experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mx-auto mb-5">
                <step.icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="text-sm font-semibold text-aegean mb-2">Step {i + 1}</div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
