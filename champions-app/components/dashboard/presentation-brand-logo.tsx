import { ChampionsWordmark } from "@/components/brand/champions-wordmark";
import { cn } from "@/lib/utils";

type PresentationBrandLogoProps = {
  className?: string;
};

export function PresentationBrandLogo({ className }: PresentationBrandLogoProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed right-6 bottom-6 z-10",
        className
      )}
      aria-hidden
    >
      <ChampionsWordmark variant="presentation" />
    </div>
  );
}
