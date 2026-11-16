import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SignupForm } from "@/features/auth/signup-form";

export const metadata: Metadata = { title: "Create an Account · Vellicor" };

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="size-12" />
        <h1 className="text-2xl font-semibold">Create an Account</h1>
      </div>
      <SignupForm />
    </>
  );
}
