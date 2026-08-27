type RecaptchaVerifyResponse = {
  success: boolean;
};

const RECAPTCHA_VERIFY_TIMEOUT_MS = 5000;

export function isRecaptchaRequired(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}

export async function verifyRecaptchaToken(
  token: string | null | undefined
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        signal: AbortSignal.timeout(RECAPTCHA_VERIFY_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as RecaptchaVerifyResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
