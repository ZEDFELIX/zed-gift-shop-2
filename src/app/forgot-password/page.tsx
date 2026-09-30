import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset password", description: "Reset your ZED Gift Shop password.", robots: { index: false } };

export default function ForgotPasswordPage() {
 return (
 <div className="container-zed flex min-h-[60vh] items-center justify-center py-14 lg:py-24">
 <ForgotPasswordForm />
 </div>
 );
}