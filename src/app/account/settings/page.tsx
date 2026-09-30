import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";

export const metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
 const user = (await getCurrentUser())!;
 return (
 <div className="space-y-6">
 <ProfileForm name={user.name} email={user.email} phone={user.phone} />
 <PasswordForm />
 </div>
 );
}