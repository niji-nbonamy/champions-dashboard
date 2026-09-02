import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RESET_INVALID_TOKEN_MESSAGE } from "@/lib/domain/password-reset";
import { findValidPasswordResetToken } from "@/lib/services/password-reset";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const session = await auth();
  if (session) {
    redirect("/dictations");
  }

  const params = await searchParams;
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const validToken = token ? await findValidPasswordResetToken(token) : null;

  if (!validToken || !token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-sm flex-col gap-2 text-center">
          <h1 className="text-display">Réinitialisation</h1>
          <p className="text-sm text-destructive" role="alert">
            {RESET_INVALID_TOKEN_MESSAGE}
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <h1 className="text-display">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <Link
        href="/login"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Retour à la connexion
      </Link>
    </main>
  );
}
