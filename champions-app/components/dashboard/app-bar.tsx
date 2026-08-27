import { ChampionsWordmark } from "@/components/brand/champions-wordmark";

import { SignOutButton } from "./sign-out-button";

export function AppBar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex min-h-[var(--spacing-app-bar-min-height)] items-center justify-between gap-3 px-4 py-2">
        <ChampionsWordmark variant="appBar" priority />
        <SignOutButton />
      </div>
    </header>
  );
}
