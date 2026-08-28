type CurvePlaceholderProps = {
  className?: string;
};

export function CurvePlaceholder({ className }: CurvePlaceholderProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      data-testid="curve-placeholder"
    >
      <div className="h-48 rounded-lg border border-dashed border-border bg-muted/30" />
    </div>
  );
}
