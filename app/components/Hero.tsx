"use client";

import Logo from "./Logo";

export default function Hero() {
  const handleCta = () => {
    if (typeof window !== "undefined" && window.scrollToSection) {
      window.scrollToSection("#story-01");
    } else {
      document
        .querySelector("#story-01")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute left-8 top-10 md:left-16 md:top-16 max-w-[80%]">
        <h1
          style={{
            fontWeight: 400,
            fontSize: "clamp(2.5rem, 6.5vw, 80px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          See exactly what your
          <br />
          competitors do better.
        </h1>
        <div className="mt-6">
          <Logo />
        </div>
      </div>

      <div className="absolute right-8 bottom-10 md:right-16 md:bottom-16 flex max-w-2xl flex-col items-start gap-8">
        <p
          style={{
            fontWeight: 300,
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.4,
          }}
        >
          AI analysis that benchmarks your landing page against the best in
          SaaS — and shows exactly what to fix and why
        </p>

        <button
          type="button"
          onClick={handleCta}
          className="group inline-flex items-stretch overflow-hidden rounded-full border border-white"
          aria-label="Learn how"
        >
          <span
            className="flex min-h-[48px] items-center justify-center bg-white px-6 py-3 text-center text-black transition-colors group-hover:bg-white/90"
            style={{ fontWeight: 400, fontSize: 15 }}
          >
            Learn how
          </span>
          <span
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center border-l border-white bg-black text-white transition-colors group-hover:bg-neutral-900"
            aria-hidden
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="7" x2="17" y2="17" />
              <polyline points="17 8 17 17 8 17" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}
