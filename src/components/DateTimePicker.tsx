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

const toDateValue = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toLocalDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const DateTimePicker = ({ value, onChange }: DateTimePickerProps) => {
  const selectedDate = useMemo(() => toDateValue(value), [value]);

  const updateDatePart = (nextDate: Date) => {
    onChange(toLocalDateString(nextDate));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 w-full justify-start text-left hover:bg-transparent">
          <span className="text-sm text-foreground truncate">
            {selectedDate ? format(selectedDate, "d MMM yyyy") : "Pick date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <CalendarIcon className="h-3.5 w-3.5" />
          Select date
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              updateDatePart(date);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;