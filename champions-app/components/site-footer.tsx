export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
      <p>
        Le code de correction CHAMPIONS a été créé par{" "}
        <a
          href="https://dezecolle.eklablog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:underline"
        >
          Farfa Dezecolle
        </a>
        .
      </p>
      <p className="mt-1.5">© {currentYear} Nicolas Bonamy.</p>
    </footer>
  );
}
