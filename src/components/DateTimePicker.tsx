import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const HOUR_SLOTS = ["07","08","09","10","11","12","13","14","15","16","17","18","19","20"];
const MINUTE_SLOTS = ["00", "15", "30", "45"];

const toDateValue = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toLocalDateTimeString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const DateTimePicker = ({ value, onChange }: DateTimePickerProps) => {
  const selectedDateTime = useMemo(() => toDateValue(value), [value]);

  const safeDate = selectedDateTime ?? new Date();
  const selectedHour = String(safeDate.getHours()).padStart(2, "0");
  const selectedMinute = (() => {
    const m = safeDate.getMinutes();
    const closest = [0, 15, 30, 45].reduce((prev, cur) =>
      Math.abs(cur - m) < Math.abs(prev - m) ? cur : prev
    );
    return String(closest).padStart(2, "0");
  })();

  const updateDatePart = (nextDate: Date) => {
    const merged = new Date(nextDate);
    merged.setHours(safeDate.getHours(), safeDate.getMinutes(), 0, 0);
    onChange(toLocalDateTimeString(merged));
  };

  const updateHour = (hour: string) => {
    const merged = new Date(safeDate);
    merged.setHours(Number(hour));
    onChange(toLocalDateTimeString(merged));
  };

  const updateMinute = (minute: string) => {
    const merged = new Date(safeDate);
    merged.setMinutes(Number(minute));
    onChange(toLocalDateTimeString(merged));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 w-full justify-start text-left hover:bg-transparent">
          <span className="text-sm text-foreground truncate">
            {selectedDateTime ? format(selectedDateTime, "d MMM '·' HH:mm") : "Pick date & time"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <CalendarIcon className="h-3.5 w-3.5" />
          Select date and time
        </div>
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={(date) => {
            if (date) {
              updateDatePart(date);
            }
          }}
          initialFocus
        />
        <div className="border-t border-border pt-3 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Hour</p>
            <div className="grid grid-cols-7 gap-1">
              {HOUR_SLOTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => updateHour(h)}
                  className={`text-xs rounded-lg py-1.5 border transition-colors ${
                    selectedHour === h
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Minutes</p>
            <div className="grid grid-cols-4 gap-1">
              {MINUTE_SLOTS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => updateMinute(min)}
                  className={`text-xs rounded-lg py-1.5 border transition-colors ${
                    selectedMinute === min
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  :{min}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;