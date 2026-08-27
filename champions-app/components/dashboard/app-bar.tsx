import Image from "next/image";

import { SignOutButton } from "./sign-out-button";

export function AppBar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex min-h-[var(--spacing-app-bar-min-height)] items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-col justify-center gap-1 lg:flex-row lg:items-center lg:gap-3">
        <Image
          src="/logo-ecole-saint-hermeland.png"
          alt="École Saint Hermeland"
          width={975}
          height={700}
          priority
          className="h-[var(--spacing-logo-app-bar-height-mobile)] w-auto object-contain lg:h-[var(--spacing-logo-app-bar-height)]"
        />
        <span className="text-sm lowercase tracking-wide text-muted-foreground">
          champions
        </span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
