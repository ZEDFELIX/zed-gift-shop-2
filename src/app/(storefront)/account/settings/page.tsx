import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";

export const metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
  const user = (await getCurrentUser())!;
  return (
  <div className="space-y-6">
  <ProfileForm name={user.name} email={user.email} phone={user.phone} />
  <PasswordForm />
  {user.role === "CUSTOMER" ? (
    <DeleteAccountForm email={user.email} />
  ) : (
    <section className="rounded-zed border border-edge bg-white p-6">
      <h2 className="font-display text-xl font-bold text-[#07111F]">Delete account</h2>
      <p className="mt-1 text-sm text-[#334155]">
        Staff and admin accounts can only be removed by another admin under Admin → Manage staff. This protects the
        shop from being left with no owner.
      </p>
    </section>
  )}
  </div>
  );
}
