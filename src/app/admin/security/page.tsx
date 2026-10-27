import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Security & recovery | Admin", robots: { index: false, follow: false } };

function Status({ good, children }: { good: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${good ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
      {children}
    </span>
  );
}

export default async function AdminSecurityPage() {
  const me = await getCurrentUser().catch(() => null);
  if (me?.role !== "ADMIN") redirect("/admin");
  const secret = process.env.AUTH_SECRET ?? "";
  const authConfigured = secret.length >= 32;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold text-[#07111F]">Security & recovery</h2>
        <p className="mt-1 text-sm text-[#334155]">Owner-only security checks and practical recovery steps for the store.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-zed border border-edge bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#07111F]">Session signing secret</h3>
            <Status good={authConfigured}>{authConfigured ? "Configured" : secret ? "Needs review" : "Missing"}</Status>
          </div>
          <p className="mt-2 text-sm text-[#334155]">
            {authConfigured
              ? "AUTH_SECRET is present and meets the recommended minimum length. The secret itself is never displayed."
              : "Set AUTH_SECRET in Vercel Environment Variables to a random value of at least 32 characters, then redeploy. Never put it in source control."}
          </p>
          <p className="mt-2 text-xs text-[#64748b]">This checks configuration presence and length only; it does not test secret randomness or rotation.</p>
        </div>
        <div className="rounded-zed border border-edge bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#07111F]">Security response headers</h3>
            <Status good>Configured</Status>
          </div>
          <p className="mt-2 text-sm text-[#334155]">The app config sets HTTPS HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and a restrictive Permissions-Policy.</p>
        </div>
        <div className="rounded-zed border border-edge bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#07111F]">Role restrictions</h3>
            <Status good>Enabled</Status>
          </div>
          <p className="mt-2 text-sm text-[#334155]">Admin pages verify the current account on the server. Staff permissions are limited, and this page is owner-only.</p>
        </div>
        <div className="rounded-zed border border-edge bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#07111F]">Audit trail</h3>
            <Status good>Available</Status>
          </div>
          <p className="mt-2 text-sm text-[#334155]">Review recorded account and store-management actions, including actor, action, entity and timestamp.</p>
          <Link href="/admin/audit-logs" className="mt-3 inline-flex text-sm font-semibold text-soft-sage hover:underline">Open audit logs</Link>
        </div>
      </section>

      <section className="rounded-zed border border-edge bg-white p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold text-[#07111F]">Database backup & recovery checklist</h3>
        <p className="mt-1 text-sm text-[#334155]">Backup status cannot be verified from this app. Confirm these items in your database provider before relying on a restore.</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-[#334155]">
          <li>Open the Supabase dashboard for the project used by this store and review its database backup/PITR options and retention for your current plan.</li>
          <li>Enable scheduled backups if your plan supports them. If it does not, arrange a regular encrypted PostgreSQL export stored outside this repository.</li>
          <li>Keep backup files private, restrict access, and never upload database dumps or environment files to GitHub or the public website.</li>
          <li>Record when the last backup succeeded and who owns recovery access. A backup is not verified until a restore test succeeds.</li>
          <li>For recovery, restore to a separate database first, verify products, orders, payments and user accounts, then change production connection settings only after checks pass.</li>
          <li>Keep Vercel environment variables and database credentials in their provider dashboards. After rotating AUTH_SECRET, expect existing sessions to require signing in again.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Open Supabase dashboard</a>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="rounded-zed border border-edge px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:bg-panel">Open Vercel dashboard</a>
        </div>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This page does not create, download, or restore database backups automatically. Verify backup retention and complete a test restore in your provider dashboard.</p>
      </section>
    </div>
  );
}
