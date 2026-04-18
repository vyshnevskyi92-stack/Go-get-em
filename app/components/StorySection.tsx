type Props = {
  id: string;
  label: string;
  headline: string;
  body?: string;
  large: string;
};

export default function StorySection({
  id,
  label,
  headline,
  body,
  large,
}: Props) {
  return (
    <section
      id={id}
      className="relative flex h-screen w-full items-center justify-center bg-black px-8 md:px-16"
    >
      <span
        className="absolute left-8 top-10 md:left-16 md:top-16"
        style={{ fontWeight: 300, fontSize: 13, opacity: 0.4 }}
      >
        {label}
      </span>

      <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-16 md:grid-cols-2">
        <div className="max-w-md">
          <h3
            style={{
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.2,
            }}
          >
            {headline}
          </h3>
          {body && (
            <p
              className="mt-4"
              style={{
                fontWeight: 300,
                fontSize: 16,
                opacity: 0.6,
                lineHeight: 1.5,
              }}
            >
              {body}
            </p>
          )}
        </div>

        <div className="md:text-left">
          <h2
            style={{
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 6vw, 72px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {large}
          </h2>
        </div>
      </div>
    </section>
  );
}
