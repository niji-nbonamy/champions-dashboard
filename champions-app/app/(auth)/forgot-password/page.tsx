import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isRecaptchaRequired } from "@/lib/services/recaptcha-verify";

import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session) {
    redirect("/dictations");
  }

  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY?.trim() || null;
  const recaptchaRequired = isRecaptchaRequired();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <h1 className="text-display">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Saisissez l&apos;adresse email de votre compte enseignant.
        </p>
      </div>

      {recaptchaRequired && !recaptchaSiteKey ? (
        <p
          className="w-full max-w-sm text-sm text-destructive"
          role="alert"
        >
          {process.env.NODE_ENV === "production"
            ? "Réinitialisation temporairement indisponible. Réessayez plus tard."
            : "Configuration reCAPTCHA incomplète : RECAPTCHA_SITE_KEY est requis lorsque RECAPTCHA_SECRET_KEY est défini."}
        </p>
      ) : (
        <ForgotPasswordForm
          recaptchaSiteKey={recaptchaSiteKey}
          recaptchaRequired={recaptchaRequired}
        />
      )}

      <Link
        href="/login"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Retour à la connexion
      </Link>
    </main>
  );
}
