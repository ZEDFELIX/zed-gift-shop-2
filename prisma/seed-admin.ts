import { randomUUID } from "node:crypto";
import { createClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * Bootstrap the store administrator through Supabase Auth and the Supabase
 * Data API. This script intentionally does not use Prisma.
 */
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Admin bootstrap requires SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAuthUserByEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<SupabaseAuthUser | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
}

async function main() {
  const email = process.env.ZED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ZED_ADMIN_PASSWORD;
  const name = process.env.ZED_ADMIN_NAME?.trim() || "ZED 2 Admin";

  if (!email || !password || password.length < 16) {
    throw new Error(
      "Admin bootstrap requires ZED_ADMIN_EMAIL and a ZED_ADMIN_PASSWORD of at least 16 characters.",
    );
  }

  const supabase = getSupabaseAdmin();
  let authUser = await findAuthUserByEmail(supabase, email);
  if (authUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(authUser.user_metadata ?? {}), name },
    });
    if (error || !data.user) {
      throw new Error(`Could not synchronize administrator Auth identity: ${error?.message ?? "unknown error"}`);
    }
    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) {
      throw new Error(`Could not create administrator Auth identity: ${error?.message ?? "unknown error"}`);
    }
    authUser = data.user;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) throw new Error(`Could not look up administrator profile: ${lookupError.message}`);

  const profile = {
    name,
    email,
    role: "ADMIN",
    status: "ACTIVE",
    emailVerified: new Date().toISOString(),
    passwordHash: await bcrypt.hash(password, 12),
    failedLoginAttempts: 0,
    lockedUntil: null,
    authUserId: authUser.id,
  };

  const result = existing
    ? await supabase.from("User").update(profile).eq("id", existing.id)
    : await supabase.from("User").insert({ id: randomUUID(), ...profile });

  if (result.error) {
    throw new Error(`Could not save administrator profile: ${result.error.message}`);
  }

  console.log("Supabase administrator Auth identity and profile synchronized.");
}

main().catch((error) => {
  console.error("Admin bootstrap failed:", error);
  process.exitCode = 1;
});
