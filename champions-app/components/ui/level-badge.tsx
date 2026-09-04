import { cva } from "class-variance-authority";

import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const levelBadgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-center text-xs font-medium",
  {
    variants: {
      level: {
        yellow: "bg-level-yellow text-level-yellow-foreground",
        green: "bg-level-green text-level-green-foreground",
        violet: "bg-level-violet text-level-violet-foreground",
        gold: "bg-level-gold text-level-gold-foreground",
      },
      layout: {
        fixed: "w-[4.5rem]",
        auto: "",
      },
    },
    defaultVariants: {
      level: "yellow",
      layout: "fixed",
    },
  }
);

type LevelBadgeProps = {
  level: ChampionsLevel;
  className?: string;
  showDot?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"span">, "children">;

function LevelBadge({
  level,
  className,
  showDot = false,
  children,
  ...props
}: LevelBadgeProps) {
  return (
    <span
      className={cn(
        levelBadgeVariants({ level, layout: showDot ? "auto" : "fixed" }),
        className
      )}
      {...props}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className="mr-1.5 inline-block size-2.5 rounded-full bg-current"
        />
      ) : null}
      {children ?? getChampionsLevelFrenchLabel(level)}
    </span>
  );
}

export { LevelBadge, levelBadgeVariants };
export type { LevelBadgeProps };
