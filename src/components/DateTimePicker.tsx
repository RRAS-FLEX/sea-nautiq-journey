import { useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock3 } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];

const getClosestMinuteOption = (minute: number) => {
  const closest = minuteOptions
    .map(Number)
    .reduce((previous, current) => (Math.abs(current - minute) < Math.abs(previous - minute) ? current : previous));
  return String(closest).padStart(2, "0");
};

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
  const selectedMinute = getClosestMinuteOption(safeDate.getMinutes());

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
            {selectedDateTime ? format(selectedDateTime, "PPP p") : "Pick date & hour"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] max-w-[calc(100vw-2rem)] p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <CalendarIcon className="h-3.5 w-3.5" />
          Select date and hour
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
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="h-3 w-3" />Hour</p>
            <Select value={selectedHour} onValueChange={updateHour}>
              <SelectTrigger>
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((hour) => (
                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Minutes</p>
            <Select value={selectedMinute} onValueChange={updateMinute}>
              <SelectTrigger>
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((minute) => (
                  <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;