import { useEffect, useState } from "react";
import { Building2, Hotel, Ticket, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addBusinessTicket, getBusinessTicketMetrics, listBusinessTickets, type BusinessTicket } from "@/lib/business-tickets";
import { useToast } from "@/hooks/use-toast";

const BusinessPromotions = () => {
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<"hotel" | "travel-agent" | "villa" | "other">("hotel");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<BusinessTicket[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, hotelLeads: 0, promotedBookings: 0, estimatedRevenue: 0 });

  useEffect(() => {
    const loadTickets = async () => {
      const [nextTickets, nextMetrics] = await Promise.all([listBusinessTickets(), getBusinessTicketMetrics()]);
      setTickets(nextTickets);
      setMetrics(nextMetrics);
    };

    loadTickets();
  }, []);

  const submitTicket = async () => {
    if (!businessName.trim() || !contactName.trim() || !contactEmail.trim() || !message.trim()) {
      toast({
        title: "Missing ticket details",
        description: "Fill all fields to send a business promotion ticket.",
        variant: "destructive",
      });
      return;
    }

    const nextTicket = await addBusinessTicket({
      businessName: businessName.trim(),
      businessType,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      message: message.trim(),
    });

    setBusinessName("");
    setContactName("");
    setContactEmail("");
    setMessage("");
    setTickets((currentTickets) => [nextTicket, ...currentTickets]);
    setMetrics((currentMetrics) => ({
      ...currentMetrics,
      total: currentMetrics.total + 1,
      hotelLeads: currentMetrics.hotelLeads + (nextTicket.businessType === "hotel" ? 1 : 0),
      promotedBookings: Math.round((currentMetrics.total + 1) * 2.1),
      estimatedRevenue: Math.round((currentMetrics.total + 1) * 2.1) * 220,
    }));

    toast({
      title: "Ticket received",
      description: "Your promotion request is now in the business queue.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-14 border-b border-border bg-gradient-ocean">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm">Business promotions</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mt-2">Hotel & partner ticket receiver</h1>
            <p className="text-primary-foreground/70 max-w-2xl mt-3">
              Capture promotional requests from hotels and travel businesses, then track estimated booking impact.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle>Create business ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Business name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
                  <Input placeholder="Contact name" value={contactName} onChange={(event) => setContactName(event.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Contact email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
                  <select
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value as "hotel" | "travel-agent" | "villa" | "other")}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="travel-agent">Travel Agent</option>
                    <option value="villa">Villa</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Textarea placeholder="Promotion request details" value={message} onChange={(event) => setMessage(event.target.value)} />
                <Button className="bg-gradient-accent text-accent-foreground" onClick={submitTicket}>Submit ticket</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Ticket className="h-4 w-4 text-aegean" />Total tickets</p><p className="text-3xl font-heading font-bold">{metrics.total}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Hotel className="h-4 w-4 text-aegean" />Hotel leads</p><p className="text-3xl font-heading font-bold">{metrics.hotelLeads}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-aegean" />Promoted bookings</p><p className="text-3xl font-heading font-bold">{metrics.promotedBookings}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4 text-aegean" />Estimated revenue</p><p className="text-3xl font-heading font-bold">€{metrics.estimatedRevenue}</p></CardContent></Card>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Incoming tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets yet.</p>
                ) : (
                  tickets.slice(0, 8).map((ticket) => (
                    <div key={ticket.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground break-words">{ticket.businessName}</p>
                        <Badge variant="outline">{ticket.businessType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-all">{ticket.contactName} • {ticket.contactEmail}</p>
                      <p className="text-sm text-muted-foreground mt-2 break-words">{ticket.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessPromotions;
