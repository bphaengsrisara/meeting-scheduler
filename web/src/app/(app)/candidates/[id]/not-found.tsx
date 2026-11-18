import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// A candidate id that does not exist or belongs to another account: one
// answer for both, so the page does not tell whether the id exists.
export default function CandidateNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Candidate Not Found</h1>
      <p className="text-muted-foreground">
        This candidate doesn&apos;t exist, or belongs to another account.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        Go to Dashboard
      </Link>
    </div>
  );
}
