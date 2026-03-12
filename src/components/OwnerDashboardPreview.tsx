import { motion } from "framer-motion";
import { Plus, BarChart3, Calendar, Ship, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

const stats = [
  { label: "Total Bookings", value: "48", icon: Ship },
  { label: "Revenue", value: "€12,400", icon: TrendingUp },
  { label: "Upcoming", value: "3", icon: Calendar },
];

const OwnerDashboardPreview = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Your Owner Dashboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Manage your boats, bookings, and earnings all in one place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-card rounded-2xl shadow-card-hover border border-border overflow-hidden"
        >
          {/* Dashboard Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="font-heading font-semibold text-foreground">Welcome back, Captain!</h3>
              <p className="text-sm text-muted-foreground">Here's your fleet overview</p>
            </div>
            <Button size="sm" className="bg-gradient-accent text-accent-foreground rounded-full gap-1.5">
              <Plus className="h-4 w-4" />
              Add Boat
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 text-center">
                <stat.icon className="h-5 w-5 text-aegean mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Placeholder chart area */}
          <div className="p-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-aegean" />
              <span className="text-sm font-medium text-foreground">Revenue Overview</span>
            </div>
            <div className="h-32 bg-muted rounded-xl flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Sign up to view your earnings dashboard
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerDashboardPreview;
