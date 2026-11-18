import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// As in Figma: the button sits at the right end, or under the text on a phone.
export function GuestNotice() {
  return (
    <Alert className="sm:pr-44">
      <CircleAlertIcon aria-hidden />
      <AlertTitle>You are using a guest account.</AlertTitle>
      <AlertDescription>
        Create an Account to keep your meetings.
      </AlertDescription>
      <div className="col-start-2 mt-2 sm:absolute sm:top-1/2 sm:right-3 sm:mt-0 sm:-translate-y-1/2">
        <Link
          href="/signup"
          // cn() drops the base border-transparent that outline overrides.
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Create an Account
        </Link>
      </div>
    </Alert>
  );
}
