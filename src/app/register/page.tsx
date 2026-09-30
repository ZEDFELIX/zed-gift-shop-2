import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create account", description: "Create a free ZED Gift Shop account." };

export default function RegisterPage() {
 return (
 <div className="container-zed flex min-h-[70vh] items-center justify-center py-14 lg:py-24">
 <AuthForm mode="register" />
 </div>
 );
}