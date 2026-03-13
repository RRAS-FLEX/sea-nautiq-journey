import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Plus, BarChart3, Calendar, Ship, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Calendar as DateCalendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";

interface ClosedSlot {
  id: string;
  dateKey: string;
  startTime: string;
  endTime: string;
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const stats = [
  { label: "Total Bookings", value: "—", icon: Ship },
  { label: "Revenue", value: "—", icon: TrendingUp },
  { label: "Upcoming", value: "—", icon: Calendar },
];

const OwnerDashboardPreview = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [closedSlots, setClosedSlots] = useState<ClosedSlot[]>([]);

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const hasOverlap = useMemo(() => {
    if (!selectedDateKey) {
      return false;
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    return closedSlots
      .filter((slot) => slot.dateKey === selectedDateKey)
      .some((slot) => {
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        return start < slotEnd && end > slotStart;
      });
  }, [closedSlots, endTime, selectedDateKey, startTime]);

  const isRangeValid = useMemo(() => {
    if (!selectedDateKey) {
      return false;
    }

    return timeToMinutes(startTime) < timeToMinutes(endTime);
  }, [selectedDateKey, startTime, endTime]);

  const canCloseBoat = isRangeValid && !hasOverlap;

  const closeBoatForSlot = () => {
    if (!selectedDateKey || !canCloseBoat) {
      return;
    }

    setClosedSlots((currentSlots) => [
      {
        id: crypto.randomUUID(),
        dateKey: selectedDateKey,
        startTime,
        endTime,
      },
      ...currentSlots,
    ]);
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-3 border-b border-border">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="p-4 sm:p-6 text-left sm:text-center border-b sm:border-b-0 border-border last:border-b-0">
                <stat.icon className="h-5 w-5 text-aegean sm:mx-auto mb-2" />
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

          <div className="p-6 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-aegean" />
              <span className="text-sm font-medium text-foreground">Close Boat Availability</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    {selectedDate ? format(selectedDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              <Button onClick={closeBoatForSlot} disabled={!canCloseBoat} className="bg-gradient-accent text-accent-foreground">
                Close Slot
              </Button>
            </div>

            {!isRangeValid && (
              <p className="text-sm text-destructive">Pick a valid date and hour range.</p>
            )}
            {isRangeValid && hasOverlap && (
              <p className="text-sm text-destructive">This boat is already closed for part of that time.</p>
            )}
            {canCloseBoat && selectedDate && (
              <p className="text-sm text-muted-foreground">
                This boat can be closed on {format(selectedDate, "PPP")} from {startTime} to {endTime}.
              </p>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {closedSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No closed slots yet.</p>
              ) : (
                closedSlots.map((slot) => (
                  <div key={slot.id} className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">
                    Closed: {slot.dateKey} • {slot.startTime} - {slot.endTime}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerDashboardPreview;
