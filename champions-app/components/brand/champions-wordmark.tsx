import Image from "next/image";

import { cn } from "@/lib/utils";

const WORDMARK_SRC = "/logo-champions-wordmark.jpg";
const WORDMARK_ALT = "La méthode CHAMPIONS";
const WORDMARK_WIDTH = 1024;
const WORDMARK_HEIGHT = 409;

const variantClasses = {
  appBar:
    "h-[var(--spacing-logo-app-bar-height-mobile)] w-auto object-contain lg:h-[var(--spacing-logo-app-bar-height)]",
  presentation:
    "h-[var(--spacing-logo-presentation-height)] w-auto object-contain opacity-[0.85]",
} as const;

type ChampionsWordmarkProps = {
  variant?: keyof typeof variantClasses;
  className?: string;
  priority?: boolean;
};

export function ChampionsWordmark({
  variant = "appBar",
  className,
  priority = false,
}: ChampionsWordmarkProps) {
  return (
    <Image
      src={WORDMARK_SRC}
      alt={WORDMARK_ALT}
      width={WORDMARK_WIDTH}
      height={WORDMARK_HEIGHT}
      priority={priority}
      className={cn(variantClasses[variant], className)}
    />
  );
}
