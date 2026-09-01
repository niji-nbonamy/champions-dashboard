import type { ReactNode } from "react";

type NextImageMockProps = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
};

type NextLinkMockProps = {
  href: string;
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-current"?: "page";
  "aria-label"?: string;
  "aria-disabled"?: boolean;
  tabIndex?: number;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
};

export function NextImageMock({
  src,
  alt,
  className,
  width,
  height,
}: NextImageMockProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  );
}

export function NextLinkMock({
  href,
  children,
  className,
  id,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel,
  "aria-disabled": ariaDisabled,
  tabIndex,
  onClick,
  onKeyDown,
}: NextLinkMockProps) {
  return (
    <a
      href={href}
      id={id}
      className={className}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </a>
  );
}

export const nextImageMockModule = {
  default: NextImageMock,
};

export const nextLinkMockModule = {
  default: NextLinkMock,
};
