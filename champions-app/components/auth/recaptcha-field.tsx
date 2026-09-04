"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

type RecaptchaFieldProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

type Grecaptcha = {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => number;
  reset: (widgetId: number) => void;
};

type WidgetState = "loading" | "ready" | "expired" | "error" | "load-failed";

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const WIDGET_STATE_MESSAGES: Record<
  Exclude<WidgetState, "loading" | "ready">,
  string
> = {
  expired:
    "La vérification a expiré. Cochez la case « Je ne suis pas un robot » à nouveau.",
  error: "La vérification a échoué. Réessayez.",
  "load-failed":
    "Impossible de charger la vérification anti-robot. Réessayez ou contactez le support.",
};

type RecaptchaWidgetProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

function RecaptchaWidget({ siteKey, onTokenChange }: RecaptchaWidgetProps) {
  const containerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [widgetState, setWidgetState] = useState<WidgetState>("loading");

  useEffect(() => {
    onTokenChange(null);

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const renderWidget = () => {
      if (!window.grecaptcha?.render || widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(container, {
        sitekey: siteKey,
        callback: (token: string) => {
          setWidgetState("ready");
          onTokenChange(token);
        },
        "expired-callback": () => {
          setWidgetState("expired");
          onTokenChange(null);
        },
        "error-callback": () => {
          setWidgetState("error");
          onTokenChange(null);
        },
      });
    };

    const resetWidget = () => {
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };

    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(renderWidget);
      return resetWidget;
    }

    if (window.grecaptcha?.render) {
      renderWidget();
      return resetWidget;
    }

    const timeoutId = window.setTimeout(() => {
      setWidgetState("load-failed");
      onTokenChange(null);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      resetWidget();
    };
  }, [onTokenChange, siteKey]);

  const statusMessage =
    widgetState === "expired" ||
    widgetState === "error" ||
    widgetState === "load-failed"
      ? WIDGET_STATE_MESSAGES[widgetState]
      : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div id={containerId} ref={containerRef} />
      {statusMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

export function RecaptchaField({ siteKey, onTokenChange }: RecaptchaFieldProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          setScriptFailed(true);
          onTokenChange(null);
        }}
      />
      {scriptFailed ? (
        <p className="text-sm text-destructive" role="alert">
          {WIDGET_STATE_MESSAGES["load-failed"]}
        </p>
      ) : scriptLoaded ? (
        <RecaptchaWidget
          key={siteKey}
          siteKey={siteKey}
          onTokenChange={onTokenChange}
        />
      ) : null}
    </>
  );
}
