"use client";

import { useState } from "react";
import type { AnalysisData } from "../lib/types";
import EmailGateModal from "./EmailGateModal";

type Card = {
  dimension: string;
  score: string;
  competitor?: string;
  // Structured fields (live analysis). Fall back to `analysis` when missing.
  yourEvidence?: string;
  competitorEvidence?: string;
  action?: string;
  analysis?: string;
};

function formatDimension(key: string): string {
  return key
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function analysisToCards(data: AnalysisData): Card[] {
  return data.recommendations.map((r) => {
    const score = data.scores[r.dimension];
    return {
      dimension: formatDimension(r.dimension),
      score: typeof score === "number" ? `${score}/10` : "",
      yourEvidence: r.yourEvidence,
      competitorEvidence: r.competitorEvidence,
      action: r.action,
      competitor: r.competitor,
    };
  });
}

const primaryCards: Card[] = [
  {
    dimension: "Hero clarity",
    score: "7/10",
    analysis:
      "Your headline states the feature, not the outcome. Top competitors lead with a measurable benefit and pair it with a visual proof point above the fold.",
  },
  {
    dimension: "Call to action",
    score: "7/10",
    analysis:
      "Single CTA is visible but lacks urgency framing. Best performers repeat the CTA after each value section and use first-person microcopy.",
  },
];

const blurredCards: Card[] = [
  {
    dimension: "Social proof",
    score: "6/10",
    analysis:
      "Logos are present but no customer quotes or outcome numbers. Add 1–2 quantified proof points within the first viewport.",
  },
  {
    dimension: "Pricing clarity",
    score: "5/10",
    analysis:
      "Pricing is three clicks away. Competitors surface a simple starting price or a free tier signal on the landing page.",
  },
  {
    dimension: "Navigation weight",
    score: "6/10",
    analysis:
      "Nav has 8 links competing with the CTA. Trim to 4 and let the primary action dominate.",
  },
];

function PreviewTile({
  height,
  src,
  caption,
}: {
  height: number;
  src: string;
  caption: string;
}) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-md"
      style={{ height, background: "#1a1a1a" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption} className="h-full w-full object-cover" />
      <span
        className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm"
        style={{
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {caption}
      </span>
    </div>
  );
}

function ResultCard({
  card,
  blurred = false,
  featured = false,
  competitorName,
  competitorScreenshot,
}: {
  card: Card;
  blurred?: boolean;
  featured?: boolean;
  competitorName?: string;
  competitorScreenshot?: string;
}) {
  const padding = featured ? "p-10" : "p-6";
  const titleSize = featured ? 32 : 22;
  const scoreSize = featured ? 22 : 16;
  const bodySize = featured ? 17 : 14;
  const previewHeight = featured ? 320 : 220;
  const hasCompetitor = Boolean(competitorScreenshot && competitorName);

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-[#0c0c0c] ${padding}`}
      style={
        blurred
          ? { filter: "blur(8px)", pointerEvents: "none" }
          : undefined
      }
    >
      {hasCompetitor ? (
        <PreviewTile
          height={previewHeight}
          src={competitorScreenshot as string}
          caption={competitorName as string}
        />
      ) : (
        <div
          className="rounded-md"
          style={{ height: previewHeight, background: "#1a1a1a" }}
        />
      )}
      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h4
          style={{
            fontWeight: 700,
            fontSize: titleSize,
            letterSpacing: featured ? "-0.02em" : undefined,
            lineHeight: 1.15,
          }}
        >
          {card.dimension}
        </h4>
        <span
          style={{ fontWeight: 700, fontSize: scoreSize, opacity: 0.8 }}
        >
          {card.score}
        </span>
      </div>
      {card.yourEvidence || card.competitorEvidence ? (
        <div className="mt-5 flex max-w-3xl flex-col gap-4">
          {card.yourEvidence && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
              >
                Your page
              </div>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: bodySize,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.55,
                }}
              >
                {card.yourEvidence}
              </p>
            </div>
          )}
          {card.competitorEvidence && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
              >
                {card.competitor ?? "Competitor"}
              </div>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: bodySize,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.55,
                }}
              >
                {card.competitorEvidence}
              </p>
            </div>
          )}
          {card.action && (
            <p
              style={{
                fontWeight: 400,
                fontSize: bodySize,
                color: "rgba(255,255,255,0.9)",
                lineHeight: 1.55,
                paddingTop: 4,
              }}
            >
              {card.action}
            </p>
          )}
        </div>
      ) : (
        <p
          className="mt-3 max-w-3xl"
          style={{
            fontWeight: 300,
            fontSize: bodySize,
            opacity: 0.7,
            lineHeight: 1.55,
            whiteSpace: "pre-line",
          }}
        >
          {card.analysis}
        </p>
      )}
    </div>
  );
}

export default function ResultsSection({
  show = false,
  data = null,
}: {
  show?: boolean;
  data?: AnalysisData | null;
}) {
  const [email, setEmail] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const liveCards = data ? analysisToCards(data) : null;
  const cardsToShow = liveCards && liveCards.length > 0 ? liveCards : primaryCards;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setGateOpen(true);
  };

  return (
    <section
      id="results"
      aria-hidden={!show}
      className="relative w-full flex-col bg-black px-6 md:px-16"
      style={{
        opacity: show ? 1 : 0,
        visibility: show ? "visible" : "hidden",
        height: show ? "auto" : 0,
        minHeight: show ? "100vh" : 0,
        paddingTop: show ? "6rem" : 0,
        paddingBottom: show ? "6rem" : 0,
        overflow: "hidden",
        pointerEvents: show ? "auto" : "none",
        display: "flex",
        transition: "opacity 0.8s ease",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          style={{
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.5vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Your page, improved
        </h2>
        <p
          className="mt-3 max-w-xl"
          style={{
            fontWeight: 300,
            fontSize: 16,
            opacity: 0.6,
            lineHeight: 1.5,
          }}
        >
          A clear breakdown of what to fix — and why it matters.
        </p>

        <div className="mt-12 flex flex-col gap-6">
          {cardsToShow.map((c) => {
            const competitorName = c.competitor;
            const competitorScreenshot =
              competitorName && data?.screenshots
                ? data.screenshots[competitorName]
                : undefined;
            return (
              <ResultCard
                key={c.dimension}
                card={c}
                featured
                competitorName={competitorName}
                competitorScreenshot={competitorScreenshot}
              />
            );
          })}
        </div>

        <form
          onSubmit={handleEmailSubmit}
          className="mt-12 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div
            className={`min-w-0 flex flex-1 min-h-[52px] items-stretch overflow-hidden rounded-full transition-all duration-300 ${
              email.trim().length > 0
                ? "input-blob-border-ring"
                : "border border-white/[0.06]"
            }`}
          >
            <div className="flex min-h-[52px] min-w-0 flex-1 items-center overflow-hidden rounded-full bg-[#141414] px-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className="w-full min-w-0 bg-transparent text-white placeholder-white/40 outline-none [color-scheme:dark] [transition:background-color_99999s_ease-out] [:-webkit-autofill]:[-webkit-text-fill-color:rgb(255_255_255)] [:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(20_20_20)]"
                style={{ fontWeight: 300, fontSize: 15 }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="group inline-flex shrink-0 items-stretch overflow-hidden rounded-full border border-white"
            aria-label="Get full analysis"
          >
            <span
              className="flex min-h-[52px] items-center justify-center bg-white px-6 py-3 text-center text-black transition-colors group-hover:bg-white/90"
              style={{ fontWeight: 400, fontSize: 15 }}
            >
              Get full analysis
            </span>
            <span
              className="flex min-h-[52px] min-w-[52px] shrink-0 items-center justify-center border-l border-white bg-black text-white transition-colors group-hover:bg-neutral-900"
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
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </span>
          </button>
        </form>

        <div className="mt-12 flex flex-col gap-6">
          {blurredCards.map((c) => (
            <ResultCard key={c.dimension} card={c} blurred />
          ))}
        </div>
      </div>
      <EmailGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </section>
  );
}
