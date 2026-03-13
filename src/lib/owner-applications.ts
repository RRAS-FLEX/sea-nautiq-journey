import { supabase } from "@/lib/supabase";

export interface OwnerApplicationInput {
  operatingArea: string;
  yearsExperience: string;
  boatCount: string;
  notes: string;
}

export interface OwnerApplicationRecord {
  id: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  ownerName: string;
  ownerEmail: string;
  notes: string;
}

const getSignedInSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("You must be signed in to apply as an owner");
  }

  return session;
};

const mapApplication = (row: any): OwnerApplicationRecord => ({
  id: row.id,
  status: row.status,
  submittedAt: row.submitted_at,
  ownerName: row.owner_name,
  ownerEmail: row.owner_email ?? "",
  notes: row.notes ?? "",
});

export const getMyOwnerApplication = async (): Promise<OwnerApplicationRecord | null> => {
  const session = await getSignedInSession();

  const { data, error } = await (supabase as any)
    .from("owner_applications")
    .select("id, status, submitted_at, owner_name, owner_email, notes")
    .eq("type", "owner_verification")
    .eq("applicant_user_id", session.user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load owner application");
  }

  return data ? mapApplication(data) : null;
};

export const submitOwnerApplication = async (input: OwnerApplicationInput): Promise<OwnerApplicationRecord> => {
  const session = await getSignedInSession();

  const { data: profile, error: profileError } = await (supabase as any)
    .from("users")
    .select("id, name, email, is_owner")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || "Failed to load your profile");
  }

  if (profile.is_owner) {
    throw new Error("Your account is already approved as an owner");
  }

  const existingApplication = await getMyOwnerApplication();
  if (existingApplication?.status === "pending") {
    throw new Error("You already have a pending owner application");
  }

  const notes = [
    `Operating area: ${input.operatingArea.trim()}`,
    `Years of experience: ${input.yearsExperience.trim()}`,
    `Boats to list: ${input.boatCount.trim()}`,
    `Notes: ${input.notes.trim() || "No extra notes provided."}`,
  ].join("\n");

  const { data, error } = await (supabase as any)
    .from("owner_applications")
    .insert({
      type: "owner_verification",
      applicant_user_id: profile.id,
      owner_name: profile.name,
      owner_email: profile.email,
      title: `Owner onboarding request for ${profile.name}`,
      notes,
      status: "pending",
    })
    .select("id, status, submitted_at, owner_name, owner_email, notes")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit owner application");
  }

  return mapApplication(data);
};