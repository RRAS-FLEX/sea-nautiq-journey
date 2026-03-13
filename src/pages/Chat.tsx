import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { MessageCircle, Send } from "lucide-react";
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
import { getBoatById } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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

const Chat = () => {
  const [searchParams] = useSearchParams();
  const { user: sessionUser } = useCurrentUser();
  const customerName = sessionUser?.name ?? "You";

  const boatId = searchParams.get("boatId") ?? "";
  const [boat, setBoat] = useState<Boat | null>(null);

  useEffect(() => {
    if (boatId) getBoatById(boatId).then(setBoat);
  }, [boatId]);

  const boatName = boat?.name ?? searchParams.get("boat") ?? "this boat";
  const ownerName = boat?.owner.name ?? "Owner";
  const boatProfileLink = boat ? `/boats/${boat.id}` : "/boats";

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages, isTyping]);

  useEffect(() => {
    if (!boatId || !sessionUser) {
      setThread(null);
      return;
    }

    const loadThread = async () => {
      try {
        setErrorMessage("");
        const freshThread = await getOrCreateThread(boatId, boatName, ownerName);
        setThread(freshThread);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load chat.");
      }
    };

    loadThread();
  }, [boatId, boatName, ownerName, sessionUser]);

  const reloadThread = async () => {
    const freshThread = await getOrCreateThread(boatId, boatName, ownerName);
    setThread(freshThread);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    await addMessage(boatId, "customer", text);
    setDraft("");
    await reloadThread();

    setIsTyping(true);
    const delay = 1400 + Math.random() * 1200;
    setTimeout(() => {
      simulateOwnerReplyAsync(boatId)
        .then(() => reloadThread())
        .finally(() => setIsTyping(false));
    }, delay);
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
                    <Badge className="bg-aegean text-primary-foreground shrink-0">Guest favorite</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {boat?.owner.title ?? "Boat owner"} · {boat?.responseTime ?? "Usually responds fast"}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 flex flex-col container mx-auto px-4 max-w-3xl w-full py-4 sm:py-6 gap-4 sm:gap-6 min-h-0">
          <ScrollArea className="flex-1 rounded-2xl sm:rounded-3xl border border-border bg-background p-3 sm:p-4 h-[calc(100dvh-20rem)] sm:h-[calc(100dvh-18rem)]">
            {!sessionUser ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="font-semibold text-foreground">Sign in to start chatting</p>
                <p className="text-sm text-muted-foreground max-w-xs">Owner conversations now use your Supabase account instead of browser-only storage.</p>
              </div>
            ) : errorMessage ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="font-semibold text-foreground">Unable to load chat</p>
                <p className="text-sm text-muted-foreground max-w-xs">{errorMessage}</p>
              </div>
            ) : !thread || thread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="rounded-full bg-aegean/10 p-4">
                  <MessageCircle className="h-8 w-8 text-aegean" />
                </div>
                <p className="font-semibold text-foreground">Start a conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask {ownerName} about availability, stops, routes, or anything about {boatName}.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {[
                    `Is ${boatName} available next weekend?`,
                    "Can you do a sunset cruise?",
                    "What's included in the price?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraft(suggestion)}
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
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
              placeholder={`Message ${ownerName}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={!sessionUser}
            />
            <Button
              size="icon"
              className="bg-gradient-accent text-accent-foreground shrink-0 rounded-xl"
              onClick={handleSend}
              disabled={!draft.trim() || !sessionUser}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Messages are stored in Supabase · {boat?.owner.responseRate ?? 97}% response rate
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
