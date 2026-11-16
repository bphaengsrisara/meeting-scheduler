import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

// The button sits at the right end, or under the text on a narrow screen.
export function GuestNotice() {
  return (
    <Alert className="flex flex-wrap items-center justify-between gap-2">
      <AlertDescription>You are using a guest account.</AlertDescription>
      <Link
        href="/signup"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Create an Account
      </Link>
    </Alert>
  );
}
