import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dictations");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <h1 className="sr-only">La méthode CHAMPIONS</h1>
      <Image
        src="/logo-champions-method-full.jpg"
        alt="La méthode CHAMPIONS — Évaluer, Progresser, Réussir"
        width={1024}
        height={409}
        sizes="(max-width: 768px) 100vw, 768px"
        priority
        className="h-auto w-full max-w-3xl object-contain"
      />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          Se connecter
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
