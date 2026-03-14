import { supabase } from "./supabase";

export type MessageSender = "customer" | "owner";

export interface ChatMessage {
  id: string;
  boatId: string;
  sender: MessageSender;
  text: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  boatId: string;
  boatName: string;
  ownerName: string;
  messages: ChatMessage[];
  lastUpdatedAt: string;
}

const toReadableChatError = (error: any, fallback: string) => {
  const message = String(error?.message ?? fallback);
  const normalized = message.toLowerCase();

  if (error?.code === "42P01" || normalized.includes("relation") && normalized.includes("chat_")) {
    return "Chat tables are missing. Run supabase_full_app_migration.sql in Supabase SQL editor.";
  }

  if (normalized.includes("foreign key") || normalized.includes("violates foreign key")) {
    return "Your account profile is not synced yet. Sign out/in and retry chat.";
  }

  return message || fallback;
};

const getCustomerSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Sign in to chat with owners.");
  }

  return session;
};

const ensureCustomerProfile = async (session: { user: any }) => {
  const email = session.user?.email?.trim?.().toLowerCase?.();
  if (!email) {
    throw new Error("Supabase user is missing an email address");
  }

  const fallbackName =
    (typeof session.user?.user_metadata?.name === "string" && session.user.user_metadata.name.trim()) ||
    email.split("@")[0] ||
    "Nautiq User";

  const { error } = await (supabase as any)
    .from("users")
    .upsert(
      {
        id: session.user.id,
        email,
        name: fallbackName,
        is_owner: false,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw new Error(toReadableChatError(error, "Failed to sync user profile for chat"));
  }
};

const mapMessage = (message: any): ChatMessage => ({
  id: message.id,
  boatId: message.boat_id,
  sender: message.sender_role,
  text: message.text,
  createdAt: message.created_at,
});

export const getOrCreateThread = async (boatId: string, boatName: string, ownerName: string): Promise<ChatThread> => {
  if (!boatId?.trim()) {
    throw new Error("Missing boat context. Open chat from a boat profile.");
  }

  const session = await getCustomerSession();
  await ensureCustomerProfile(session);
  const threadsTable = (supabase as any).from("chat_threads");
  const messagesTable = (supabase as any).from("chat_messages");

  let { data: thread } = await threadsTable
    .select("*")
    .eq("boat_id", boatId)
    .eq("customer_id", session.user.id)
    .maybeSingle();

  if (!thread) {
    const { data: createdThread, error } = await threadsTable
      .insert({
        boat_id: boatId,
        boat_name: boatName,
        owner_name: ownerName,
        customer_id: session.user.id,
      })
      .select()
      .single();

    if (error || !createdThread) {
      const maybeExisting = await threadsTable
        .select("*")
        .eq("boat_id", boatId)
        .eq("customer_id", session.user.id)
        .maybeSingle();

      if (maybeExisting?.data) {
        thread = maybeExisting.data;
      } else {
        throw new Error(toReadableChatError(error, "Failed to create chat thread"));
      }
    } else {
      thread = createdThread;
    }
  }

  const { data: messageRows, error: messageError } = await messagesTable
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (messageError) {
    throw new Error(toReadableChatError(messageError, "Failed to load chat messages"));
  }

  return {
    id: thread.id,
    boatId: thread.boat_id,
    boatName: thread.boat_name,
    ownerName: thread.owner_name,
    messages: Array.isArray(messageRows) ? messageRows.map(mapMessage) : [],
    lastUpdatedAt: thread.last_updated_at,
  };
};

export const addMessage = async (boatId: string, sender: MessageSender, text: string): Promise<ChatMessage> => {
  if (!boatId?.trim()) {
    throw new Error("Missing boat context. Open chat from a boat profile.");
  }

  const session = await getCustomerSession();
  await ensureCustomerProfile(session);
  const thread = await getOrCreateThread(boatId, "Boat", "Owner");
  const { data, error } = await (supabase as any)
    .from("chat_messages")
    .insert({
      thread_id: thread.id,
      boat_id: boatId,
      sender_role: sender,
      sender_user_id: sender === "customer" ? session.user.id : null,
      text: text.trim(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(toReadableChatError(error, "Failed to send message"));
  }

  await (supabase as any).from("chat_threads").update({ last_updated_at: data.created_at }).eq("id", thread.id);
  return mapMessage(data);
};

// Canned auto-reply pool the simulated owner picks from
const ownerReplies = [
  "Thanks for reaching out! I'll confirm your preferred date as soon as possible.",
  "Great question! Feel free to ask about any specific stops or routes you'd like.",
  "Absolutely, we can accommodate that. Let me know your group size and I'll sort it out.",
  "The boat is fully equipped for that type of trip — sunscreen and drinks are on us!",
  "I'll check the calendar and get back to you with an available slot very shortly.",
  "Happy to help. What time of day works best for your group?",
  "That bay is one of my favourites too — great choice!",
];

export const simulateOwnerReply = (boatId: string): ChatMessage => {
  throw new Error("Use the async simulateOwnerReply flow.");
};

export const simulateOwnerReplyAsync = async (boatId: string): Promise<ChatMessage> => {
  if (!boatId?.trim()) {
    throw new Error("Missing boat context. Open chat from a boat profile.");
  }

  const text = ownerReplies[Math.floor(Math.random() * ownerReplies.length)];
  const thread = await getOrCreateThread(boatId, "Boat", "Owner");
  const { data, error } = await (supabase as any)
    .from("chat_messages")
    .insert({
      thread_id: thread.id,
      boat_id: boatId,
      sender_role: "owner",
      sender_user_id: null,
      text,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(toReadableChatError(error, "Failed to simulate owner reply"));
  }

  await (supabase as any).from("chat_threads").update({ last_updated_at: data.created_at }).eq("id", thread.id);
  return mapMessage(data);
};
