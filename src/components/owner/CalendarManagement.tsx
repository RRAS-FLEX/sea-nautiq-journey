import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getOwnerBoats, addCalendarEvent, getOwnerCalendarEvents, deleteCalendarEvent, OwnerBoat, OwnerCalendarEvent } from "../../lib/owner-dashboard";

const CalendarManagement = () => {
  const [boats, setBoats] = useState<OwnerBoat[]>([]);
  const [selectedBoatId, setSelectedBoatId] = useState<string>(boats[0]?.id || "");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<"booked" | "blocked" | "maintenance">("blocked");
  const [guestName, setGuestName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<OwnerCalendarEvent[]>([]);

  useEffect(() => {
    const loadBoats = async () => {
      const nextBoats = await getOwnerBoats();
      setBoats(nextBoats);
      if (nextBoats[0] && !selectedBoatId) {
        setSelectedBoatId(nextBoats[0].id);
      }
    };

    loadBoats();
  }, [selectedBoatId]);

  useEffect(() => {
    if (!selectedBoatId) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      const nextEvents = await getOwnerCalendarEvents(selectedBoatId);
      setEvents(nextEvents);
    };

    loadEvents();
  }, [selectedBoatId]);

  const selectedBoat = boats.find((b) => b.id === selectedBoatId);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) return;

    const createdEvent = await addCalendarEvent({
      boatId: selectedBoatId,
      date: eventDate,
      type: eventType,
      guestName: eventType === "booked" ? guestName : undefined,
    });

    setEvents((currentEvents) => [...currentEvents, createdEvent].sort((a, b) => a.date.localeCompare(b.date)));

    setEventDate("");
    setGuestName("");
    setEventType("blocked");
    setShowForm(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Delete this event?")) {
      await deleteCalendarEvent(id);
      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {boats.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Add boats first to manage availability calendar.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-aegean" />
                  Availability Calendar
                </CardTitle>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-accent text-accent-foreground"
                >
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="boat-select">Select Boat</Label>
                <Select value={selectedBoatId} onValueChange={setSelectedBoatId}>
                  <SelectTrigger id="boat-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boats.map((boat) => (
                      <SelectItem key={boat.id} value={boat.id}>
                        {boat.name} ({boat.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showForm && (
                <form onSubmit={handleAddEvent} className="rounded-xl border border-border p-4 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-foreground">Add Calendar Event</p>
                    <button type="button" onClick={() => setShowForm(false)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Event Type</Label>
                      <Select value={eventType} onValueChange={(value) => setEventType(value as any)}>
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {eventType === "booked" && (
                      <div className="space-y-2">
                        <Label htmlFor="guest">Guest Name</Label>
                        <Input
                          id="guest"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Guest name"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-gradient-accent text-accent-foreground">
                      Add Event
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {events.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {events.length} event{events.length !== 1 ? "s" : ""} for {selectedBoat?.name}
                  </p>
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-border p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {event.guestName && <p className="text-sm text-muted-foreground">Guest: {event.guestName}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            event.type === "booked"
                              ? "bg-emerald-500"
                              : event.type === "blocked"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }
                        >
                          {event.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No events yet. Add one to set availability, blocks, or maintenance.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>📅 Calendar Tip:</strong> Use this to mark your boat's availability. Block dates when you don't
                want bookings, mark maintenance days, or track confirmed bookings.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CalendarManagement;
