type LogoProps = {
  className?: string;
};

/** Wordmark: “GO” in an outlined pill + “GET'EM” — full-contrast brand mark. */
export default function Logo({ className = "" }: LogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 text-white ${className}`}
      style={{
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
      aria-label="Go get'em"
    >
      <span
        className="inline-flex min-h-[2rem] min-w-[2.25rem] shrink-0 items-center justify-center rounded-md border border-white/70 px-2 py-1.5"
        style={{ fontWeight: 700, fontSize: 13 }}
      >
        GO
      </span>
      <span style={{ fontWeight: 700, fontSize: 15 }}>GET&apos;EM</span>
    </div>
  );
}
