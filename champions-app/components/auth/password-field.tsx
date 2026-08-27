"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = {
  id?: string;
  name: string;
  label: string;
  autoComplete: "new-password" | "current-password";
  required?: boolean;
  onChange?: (value: string) => void;
};

export function PasswordField({
  id: idProp,
  name,
  label,
  autoComplete,
  required = false,
  onChange,
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          onChange={(event) => onChange?.(event.target.value)}
          onInput={(event) => onChange?.(event.currentTarget.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
