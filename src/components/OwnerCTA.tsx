import { Anchor, TrendingUp, Calendar, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

const benefits = [
  { icon: Globe, text: "Reach tourists before they arrive" },
  { icon: TrendingUp, text: "Receive online bookings & deposits" },
  { icon: Calendar, text: "Manage your calendar easily" },
];

const OwnerCTA = () => {
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
              Own a Boat? Start earning with Nautiq.
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8">
              Join hundreds of boat owners already earning with Nautiq across Greek islands.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              {benefits.map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2 text-primary-foreground/80 text-sm"
                >
                  <b.icon className="h-4 w-4 text-turquoise" />
                  {b.text}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-turquoise text-accent-foreground rounded-full px-8 text-base font-semibold hover:bg-turquoise/90"
            >
              List Your Boat
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OwnerCTA;
