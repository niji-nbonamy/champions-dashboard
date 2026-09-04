import { cn } from "@/lib/utils";

import { SpeechTherapyIcon } from "./speech-therapy-icon";

type StudentNameWithSpeechTherapyProps = {
  displayName: string;
  hasSpeechTherapy?: boolean;
  showIndicatorIcon?: boolean;
  className?: string;
};

export function StudentNameWithSpeechTherapy({
  displayName,
  hasSpeechTherapy = false,
  showIndicatorIcon = true,
  className,
}: StudentNameWithSpeechTherapyProps) {
  const showIcon = showIndicatorIcon && hasSpeechTherapy;

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span className="min-w-0 break-words">{displayName}</span>
      {showIcon ? (
        <>
          <span
            aria-hidden="true"
            className="bg-border h-4 w-px shrink-0"
          />
          <SpeechTherapyIcon title="Suivi orthophoniste" />
        </>
      ) : null}
    </span>
  );
}
