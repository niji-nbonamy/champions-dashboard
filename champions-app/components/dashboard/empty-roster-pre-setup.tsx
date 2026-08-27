import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  EMPTY_ROSTER_CTA_LABEL,
  EMPTY_ROSTER_MESSAGE,
} from "@/lib/domain/dictation-readiness";
import { cn } from "@/lib/utils";

type EmptyRosterPreSetupProps = {
  showCta?: boolean;
  ctaHref?: string;
  className?: string;
};

export function EmptyRosterPreSetup({
  showCta = false,
  ctaHref,
  className,
}: EmptyRosterPreSetupProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm text-muted-foreground">{EMPTY_ROSTER_MESSAGE}</p>
      {showCta && ctaHref ? (
        <Link href={ctaHref} className={buttonVariants({ variant: "default" })}>
          {EMPTY_ROSTER_CTA_LABEL}
        </Link>
      ) : null}
    </div>
  );
}
