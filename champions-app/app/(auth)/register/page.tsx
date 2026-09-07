import Link from "next/link";

import { BetaAllowlistNotice } from "@/components/auth/beta-allowlist-notice";
import { isRecaptchaRequired } from "@/lib/services/recaptcha-verify";
import { isEmailAllowlistEnforced } from "@/lib/services/email-allowlist";

import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY?.trim() || null;
  const recaptchaRequired = isRecaptchaRequired();
  const showBetaNotice = isEmailAllowlistEnforced();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Inscrivez-vous pour accéder à vos tableaux de bord.
        </p>
      </div>

      {showBetaNotice ? <BetaAllowlistNotice /> : null}

      {recaptchaRequired && !recaptchaSiteKey ? (
        <p
          className="w-full max-w-sm text-sm text-destructive"
          role="alert"
        >
          {process.env.NODE_ENV === "production"
            ? "Inscription temporairement indisponible. Réessayez plus tard."
            : "Configuration reCAPTCHA incomplète : RECAPTCHA_SITE_KEY est requis lorsque RECAPTCHA_SECRET_KEY est défini."}
        </p>
      ) : (
        <RegisterForm
          recaptchaSiteKey={recaptchaSiteKey}
          recaptchaRequired={recaptchaRequired}
        />
      )}

      <p className="text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
