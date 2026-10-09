import "server-only";

import bcrypt from "bcryptjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SessionPayload = {
 sub: string;
 role: "CUSTOMER" | "STAFF" | "ADMIN";
 email: string;
 name: string;
 iat?: number;
 exp?: number;
};

function getSecret(): Uint8Array {
 const secret = process.env.AUTH_SECRET;
 if (!secret || secret.length < 8) {
 throw new Error("AUTH_SECRET is not configured. Set it in your environment.");
 }
 return new TextEncoder().encode(secret);
}

export async function getSession(): Promise<SessionPayload | null> {
 const supabase = await createSupabaseServerClient();
 const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
 if (authError || !authUser?.id || !authUser.email) return null;

 const admin = createSupabaseAdminClient();
 const { data: initialProfile, error } = await admin
   .from("User")
   .select("id,name,email,phone,role,status")
   .eq("authUserId", authUser.id)
   .maybeSingle();
 let profile = initialProfile;
 if (error) throw new Error(`Could not load account profile: ${error.message}`);

 // Link a legacy profile only after Supabase Auth has authenticated the same
 // email. New registrations check for existing profiles before creating users.
 if (!profile) {
   const lookup = await admin.from("User")
     .select("id,name,email,phone,role,status")
     .eq("email", authUser.email.toLowerCase())
     .maybeSingle();
   if (lookup.error) throw new Error(`Could not find account profile: ${lookup.error.message}`);
   if (lookup.data) {
     const linked = await admin.from("User").update({ authUserId: authUser.id, updatedAt: new Date().toISOString() }).eq("id", lookup.data.id);
     if (linked.error) throw new Error(`Could not link account profile: ${linked.error.message}`);
     profile = lookup.data;
   }
 }
 if (!profile || profile.status !== "ACTIVE") return null;

 const role = profile.role === "ADMIN" || profile.role === "STAFF" ? profile.role : "CUSTOMER";
 return {
   sub: profile.id,
   role,
   email: profile.email,
   name: profile.name,
 };
}

export async function getCurrentUser() {
 const session = await getSession();
 if (!session) return null;
 const admin = createSupabaseAdminClient();
 const { data, error } = await admin.from("User")
   .select("id,name,email,phone,role,emailVerified,createdAt,status")
   .eq("id", session.sub)
   .maybeSingle();
 if (error) throw new Error(`Could not load current user: ${error.message}`);
 if (!data || data.status !== "ACTIVE") return null;
 return data;
}

export async function requireUser() {
 const user = await getCurrentUser();
 if (!user) {
 throw new Error("AUTH_REQUIRED");
 }
 return user;
}

export async function isAdmin() {
 const user = await getCurrentUser();
 return user?.role === "ADMIN" || user?.role === "STAFF";
}

export async function requireAdmin() {
 const user = await getCurrentUser();
 if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
 throw new Error("ADMIN_REQUIRED");
 }
 return user;
}

export async function hashPassword(password: string): Promise<string> {
 return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
 return bcrypt.compare(password, hash);
}
