import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Compass className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That address doesn&apos;t exist in SprintFlow.
      </p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-2" })}>
        Go to the dashboard
      </Link>
    </div>
  );
}
