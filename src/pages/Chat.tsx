import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Lightbulb, MessageCircle, RefreshCcw, Send, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  addMessage,
  getOrCreateThread,
  simulateOwnerReplyAsync,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat";
import { buildBoatDetailsPath, getBoatByPublicReference } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";

const OwnerAvatar = ({ ownerName, size = "sm" }: { ownerName: string; size?: "sm" | "lg" }) => {
  const initials = ownerName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const cls = size === "lg" ? "h-12 w-12" : "h-8 w-8";
  return (
    <Avatar className={`${cls} shrink-0 border border-border`}>
      <AvatarFallback className="bg-aegean/10 text-aegean font-semibold text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
};

const CustomerAvatar = ({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) => {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const cls = size === "lg" ? "h-12 w-12" : "h-8 w-8";
  return (
    <Avatar className={`${cls} shrink-0 border border-border`}>
      <AvatarFallback className="bg-turquoise/10 text-turquoise font-semibold text-xs">{initials || "ME"}</AvatarFallback>
    </Avatar>
  );
};

const Bubble = ({
  msg,
  ownerName,
  customerName,
}: {
  msg: ChatMessage;
  ownerName: string;
  customerName: string;
}) => {
  const isOwner = msg.sender === "owner";
  return (
    <div className={`flex gap-2 items-end ${isOwner ? "flex-row" : "flex-row-reverse"}`}>
      {isOwner ? (
        <OwnerAvatar ownerName={ownerName} />
      ) : (
        <CustomerAvatar name={customerName} />
      )}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isOwner ? "items-start" : "items-end"} flex flex-col`}>
        <p className={`text-xs text-muted-foreground px-1 ${isOwner ? "text-left" : "text-right"}`}>
          {isOwner ? ownerName : customerName}
        </p>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwner
              ? "rounded-bl-sm bg-muted text-foreground"
              : "rounded-br-sm bg-aegean text-primary-foreground"
          }`}
        >
          {msg.text}
        </div>
        <p className={`text-xs text-muted-foreground/60 px-1 ${isOwner ? "text-left" : "text-right"}`}>
          {format(new Date(msg.createdAt), "HH:mm")}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator = ({ ownerName }: { ownerName: string }) => (
  <div className="flex gap-2 items-end">
    <OwnerAvatar ownerName={ownerName} />
    <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 flex gap-1 items-center">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

const buildSuggestionIdeas = (boatName: string, ownerName: string, tl: (en: string, el: string) => string) => [
  tl(`Is ${boatName} available next weekend?`, `Είναι διαθέσιμο το ${boatName} το επόμενο Σαββατοκύριακο;`),
  tl("Can you do a sunset cruise?", "Μπορείτε να κάνετε sunset κρουαζιέρα;"),
  tl("What's included in the price?", "Τι περιλαμβάνεται στην τιμή;"),
  tl("Can we customize the route and swim stops?", "Μπορούμε να προσαρμόσουμε τη διαδρομή και τις στάσεις για μπάνιο;"),
  tl("Do you provide skipper and fuel estimate?", "Παρέχετε skipper και εκτίμηση καυσίμων;"),
  tl(`How fast do you usually respond, ${ownerName}?`, `Πόσο γρήγορα απαντάτε συνήθως, ${ownerName};`),
];

const Chat = () => {
  const { tl } = useLanguage();
  const [searchParams] = useSearchParams();
  const { user: sessionUser } = useCurrentUser();
  const customerName = sessionUser?.name ?? "You";

  const boatReference = searchParams.get("boatRef") ?? searchParams.get("boatId") ?? "";
  const [boat, setBoat] = useState<Boat | null>(null);

  useEffect(() => {
    if (!boatReference) {
      setBoat(null);
      return;
    }

    getBoatByPublicReference(boatReference).then(setBoat);
  }, [boatReference]);

  const boatName = boat?.name ?? searchParams.get("boat") ?? "this boat";
  const ownerName = boat?.owner.name ?? "Owner";
  const boatProfileLink = boat ? buildBoatDetailsPath(boat) : "/boats";

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ownerReplyTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasBoatContext = Boolean(boatReference);
  const boatId = boat?.id ?? "";
  const maxMessageLength = 240;
  const suggestionIdeas = buildSuggestionIdeas(boatName, ownerName, tl);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages, isTyping]);

  useEffect(() => {
    if (!boatReference || !sessionUser || !boat?.id) {
      if (!boatReference) {
        setErrorMessage(tl("Missing boat context. Open chat from a boat profile.", "Λείπει το σκάφος. Άνοιξε τη συνομιλία από το προφίλ σκάφους."));
      }
      setThread(null);
      return;
    }

    const loadThread = async () => {
      try {
        setErrorMessage("");
        const freshThread = await getOrCreateThread(boat.id, boat.name, ownerName);
        setThread(freshThread);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load chat.");
      }
    };

    loadThread();
  }, [boat?.id, boat?.name, boatReference, ownerName, sessionUser, tl]);

  useEffect(() => {
    return () => {
      if (ownerReplyTimerRef.current) {
        window.clearTimeout(ownerReplyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionUser || !boat?.id) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (isTyping || isSending) {
        return;
      }

      reloadThread().catch(() => {
        // Keep polling resilient without interrupting UI.
      });
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sessionUser, boat?.id, isTyping, isSending]);

  const reloadThread = async () => {
    if (!boat?.id || !sessionUser) {
      return;
    }
    const freshThread = await getOrCreateThread(boat.id, boat.name, ownerName);
    setThread(freshThread);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || text.length > maxMessageLength || !boat?.id || !sessionUser || isSending) return;

    try {
      setIsSending(true);
      setErrorMessage("");
      await addMessage(boat.id, "customer", text);
      setDraft("");
      await reloadThread();

      setIsTyping(true);
      const delay = 1400 + Math.random() * 1200;
      ownerReplyTimerRef.current = window.setTimeout(() => {
        simulateOwnerReplyAsync(boat.id)
          .then(() => reloadThread())
          .catch((error) => setErrorMessage(error instanceof Error ? error.message : tl("Unable to load chat", "Αδυναμία φόρτωσης συνομιλίας")))
          .finally(() => {
            setIsTyping(false);
            setIsSending(false);
            ownerReplyTimerRef.current = null;
          });
      }, delay);
    } catch (error) {
      setIsSending(false);
      setIsTyping(false);
      setErrorMessage(error instanceof Error ? error.message : tl("Unable to load chat", "Αδυναμία φόρτωσης συνομιλίας"));
    }
  };

  const handleManualRefresh = async () => {
    if (!sessionUser || !boat?.id) {
      return;
    }

    try {
      setIsRefreshing(true);
      setErrorMessage("");
      await reloadThread();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tl("Unable to load chat", "Αδυναμία φόρτωσης συνομιλίας"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setDraft(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col">
        {/* ── Header ── */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link to={boatProfileLink} className="text-sm text-aegean hover:text-turquoise font-medium shrink-0">
              ← {boatName}
            </Link>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <OwnerAvatar ownerName={ownerName} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{ownerName}</p>
                  {boat?.owner.isSuperhost && (
                    <Badge className="bg-aegean text-primary-foreground shrink-0">{tl("Guest favorite", "Αγαπημένο των επισκεπτών")}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {boat?.owner.title ?? tl("Boat owner", "Ιδιοκτήτης σκάφους")} · {boat?.responseTime ?? tl("Usually responds fast", "Συνήθως απαντά γρήγορα")}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {tl("Online", "Online")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-xs"
              onClick={handleManualRefresh}
              disabled={isRefreshing || !sessionUser || !hasBoatContext}
            >
              <RefreshCcw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {tl("Refresh", "Ανανέωση")}
            </Button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 flex flex-col container mx-auto px-4 max-w-3xl w-full py-4 sm:py-6 gap-4 sm:gap-6 min-h-0">
          <ScrollArea className="flex-1 rounded-2xl sm:rounded-3xl border border-border bg-background p-3 sm:p-4 h-[calc(100dvh-20rem)] sm:h-[calc(100dvh-18rem)]">
            {!sessionUser ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="font-semibold text-foreground">{tl("Sign in to start chatting", "Συνδέσου για να ξεκινήσεις συνομιλία")}</p>
                <p className="text-sm text-muted-foreground max-w-xs">{tl("Owner conversations now use your Supabase account instead of browser-only storage.", "Οι συνομιλίες με ιδιοκτήτες χρησιμοποιούν τώρα τον λογαριασμό Supabase αντί για τοπική αποθήκευση browser.")}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/">{tl("Go to home and sign in", "Πήγαινε στην αρχική και συνδέσου")}</Link>
                </Button>
              </div>
            ) : errorMessage ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="font-semibold text-foreground">{tl("Unable to load chat", "Αδυναμία φόρτωσης συνομιλίας")}</p>
                <p className="text-sm text-muted-foreground max-w-xs">{errorMessage}</p>
                <Button size="sm" variant="outline" onClick={handleManualRefresh}>
                  <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                  {tl("Retry", "Δοκίμασε ξανά")}
                </Button>
              </div>
            ) : !thread || thread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="rounded-full bg-aegean/10 p-4">
                  <MessageCircle className="h-8 w-8 text-aegean" />
                </div>
                <p className="font-semibold text-foreground">Start a conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {tl("Ask", "Ρώτησε")} {ownerName} {tl("about availability, stops, routes, or anything about", "για διαθεσιμότητα, στάσεις, διαδρομές ή οτιδήποτε σχετικά με")} {boatName}.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {suggestionIdeas.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="rounded-full border border-aegean/30 bg-aegean/5 px-3 py-1.5 text-xs text-aegean hover:bg-aegean/10 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {thread.messages.map((msg) => (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    ownerName={ownerName}
                    customerName={customerName}
                  />
                ))}
                {isTyping && <TypingIndicator ownerName={ownerName} />}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* ── Input bar ── */}
          <div className="flex gap-3 items-center rounded-2xl border border-border bg-card p-2 shadow-card">
            <CustomerAvatar name={customerName} />
            <Input
              ref={inputRef}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
              placeholder={`${tl("Message", "Μήνυμα προς")} ${ownerName}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxMessageLength}
              autoFocus
              disabled={!sessionUser || !hasBoatContext || isSending}
            />
            <Button
              size="icon"
              className="bg-gradient-accent text-accent-foreground shrink-0 rounded-xl"
              onClick={handleSend}
              disabled={!draft.trim() || !sessionUser || !hasBoatContext || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {sessionUser && hasBoatContext ? (
            <div className="rounded-2xl border border-border/80 bg-card/80 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-aegean" />
                <p className="text-xs font-semibold text-foreground">{tl("Message ideas", "Ιδέες μηνυμάτων")}</p>
                <Sparkles className="h-3.5 w-3.5 text-turquoise" />
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestionIdeas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => applySuggestion(idea)}
                    className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-aegean/40 hover:bg-aegean/5 transition-colors"
                  >
                    {idea}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{tl("Tip: keep your message clear to get a faster response.", "Συμβουλή: γράψε καθαρό μήνυμα για πιο γρήγορη απάντηση.")}</span>
                <span>{draft.length}/{maxMessageLength}</span>
              </div>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            {tl("Messages are stored in Supabase", "Τα μηνύματα αποθηκεύονται στο Supabase")} · {boat?.owner.responseRate ?? 97}% {tl("response rate", "ποσοστό απόκρισης")}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
