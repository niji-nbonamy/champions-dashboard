import Image from "next/image";

export function AppBar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex min-h-[var(--spacing-app-bar-min-height)] flex-col justify-center gap-1 px-4 py-2 lg:flex-row lg:items-center lg:gap-3">
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
    </header>
  );
}
