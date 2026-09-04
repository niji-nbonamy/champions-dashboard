import { cn } from "@/lib/utils";

const SPEECH_THERAPY_ICON_SRC = "/icons/speech-therapy.png";
const SPEECH_THERAPY_ICON_WIDTH = 452;
const SPEECH_THERAPY_ICON_HEIGHT = 553;

type SpeechTherapyIconProps = {
  className?: string;
  title?: string;
};

export function SpeechTherapyIcon({ className, title }: SpeechTherapyIconProps) {
  return (
    <img
      src={SPEECH_THERAPY_ICON_SRC}
      width={SPEECH_THERAPY_ICON_WIDTH}
      height={SPEECH_THERAPY_ICON_HEIGHT}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={cn("h-[1.125rem] w-auto shrink-0 object-contain", className)}
    />
  );
}
