import { BETA_PILOT_NOTICE } from "@/lib/domain/beta-access";

export function BetaAllowlistNotice() {
  return (
    <p
      className="w-full max-w-sm rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
      role="status"
    >
      {BETA_PILOT_NOTICE}
    </p>
  );
}
