import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in", description: "Log in to your ZED Gift Shop account." };

export default function LoginPage() {
 return (
 <div className="container-zed flex min-h-[70vh] items-center justify-center py-14 lg:py-24">
 <AuthForm mode="login" />
 </div>
 );
}