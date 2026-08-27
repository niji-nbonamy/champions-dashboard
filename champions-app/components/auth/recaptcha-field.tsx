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

export function RecaptchaField({ siteKey, onTokenChange }: RecaptchaFieldProps) {
  const containerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetState, setWidgetState] = useState<WidgetState>("loading");

  useEffect(() => {
    onTokenChange(null);
    widgetIdRef.current = null;
    setWidgetState("loading");
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

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

    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(renderWidget);
      return () => {
        if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        widgetIdRef.current = null;
      };
    }

    if (window.grecaptcha?.render) {
      renderWidget();
      return () => {
        if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        widgetIdRef.current = null;
      };
    }

    setWidgetState("load-failed");
    onTokenChange(null);
  }, [onTokenChange, scriptLoaded, siteKey]);

  const statusMessage =
    widgetState === "expired" ||
    widgetState === "error" ||
    widgetState === "load-failed"
      ? WIDGET_STATE_MESSAGES[widgetState]
      : null;

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          setWidgetState("load-failed");
          onTokenChange(null);
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <div id={containerId} ref={containerRef} />
        {statusMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </>
  );
}
