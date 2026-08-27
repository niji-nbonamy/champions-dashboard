import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  if (session) {
    redirect("/dictations");
  }

  const params = await searchParams;
  const registered = params?.registered;
  const registeredValue = Array.isArray(registered) ? registered[0] : registered;
  const showRegistrationSuccess = registeredValue === "1";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <h1 className="text-display">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous avec votre compte enseignant.
        </p>
      </div>

      {showRegistrationSuccess ? (
        <p
          className="w-full max-w-sm rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Compte créé avec succès. Vous pouvez vous connecter.
        </p>
      ) : null}

      <LoginForm />

      <p className="text-sm text-muted-foreground">
        Besoin d&apos;un compte ?{" "}
        <Link
          href="/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          Créer un compte
        </Link>
      </p>

      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
