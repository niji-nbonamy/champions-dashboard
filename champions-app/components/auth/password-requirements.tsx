"use client";

import {
  getPasswordRequirementStatus,
  type PasswordRequirementId,
} from "@/lib/domain/registration";

const REQUIREMENT_LABELS: Record<PasswordRequirementId, string> = {
  length: "8 caractères",
  digit: "1 chiffre",
  lowercase: "1 minuscule",
  uppercase: "1 majuscule",
  special: "1 caractère spécial",
  match: "Correspondance des deux mots de passe",
};

const REQUIREMENT_ORDER: PasswordRequirementId[] = [
  "length",
  "digit",
  "lowercase",
  "uppercase",
  "special",
  "match",
];

type PasswordRequirementsProps = {
  password: string;
  confirmPassword: string;
};

export function PasswordRequirements({
  password,
  confirmPassword,
}: PasswordRequirementsProps) {
  const status = getPasswordRequirementStatus(password, confirmPassword);

  return (
    <div className="rounded-md border border-border px-3 py-3 text-sm">
      <p className="mb-2 text-foreground">
        Saisissez un mot de passe comportant au moins :
      </p>
      <ul className="flex flex-col gap-1">
        {REQUIREMENT_ORDER.map((requirementId) => {
          const satisfied = status[requirementId];

          return (
            <li
              key={requirementId}
              className={
                satisfied
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            >
              <span aria-hidden="true">• </span>
              {REQUIREMENT_LABELS[requirementId]}
              <span className="sr-only">
                {satisfied ? " — respecté" : " — non respecté"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
