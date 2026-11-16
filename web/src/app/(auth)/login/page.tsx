import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Login · Vellicor" };

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="size-12" />
        <h1 className="text-2xl font-semibold">Candidate Meeting Scheduler</h1>
      </div>
      <LoginForm />
    </>
  );
}
