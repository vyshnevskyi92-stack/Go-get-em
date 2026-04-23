"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisData, Competitor } from "../lib/types";

const MOCK_QUERY =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "false" ? "" : "?mock=true";

const FALLBACK_COMPETITORS: Competitor[] = [
  { name: "Linear", domain: "linear.app" },
  { name: "Asana", domain: "asana.com" },
  { name: "ClickUp", domain: "clickup.com" },
];

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  return t.length >= 4 && /\./.test(t);
}

const ANALYZE_PHASES = [
  "Reading screenshots",
  "Comparing patterns",
  "Spotting weak spots",
  "Generating insights",
];

type Phase = "idle" | "identifying" | "identified" | "analyzing";

export default function InputSection({
  onAnalyzeComplete,
  onAnalyzingChange,
}: {
  onAnalyzeComplete?: (data: AnalysisData) => void;
  onAnalyzingChange?: (analyzing: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [url, setUrl] = useState("");
  const [foundCompetitors, setFoundCompetitors] = useState<Competitor[] | null>(
    null,
  );
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const lastIdentifiedUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const showing = phase === "identified" || phase === "analyzing";
    onAnalyzingChange?.(showing);
  }, [phase, onAnalyzingChange]);

  useEffect(() => {
    if (phase !== "analyzing") {
      setPhaseIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % ANALYZE_PHASES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [phase]);

  async function runIdentify(targetUrl: string) {
    const myId = ++requestIdRef.current;
    setPhase("identifying");
    setFoundCompetitors(null);
    try {
      const [res] = await Promise.all([
        fetch(`/api/identify${MOCK_QUERY}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        }),
        new Promise((r) => setTimeout(r, 2600)),
      ]);
      if (myId !== requestIdRef.current) return;
      if (!res.ok) throw new Error(`identify failed: ${res.status}`);
      const data = (await res.json()) as { competitors: Competitor[] };
      if (myId !== requestIdRef.current) return;
      setFoundCompetitors(data.competitors);
      lastIdentifiedUrlRef.current = targetUrl;
      setPhase("identified");
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      console.error("Identify failed:", err);
      setPhase("idle");
    }
  }

  async function runAnalyze() {
    const targetUrl = url.trim();
    if (phase !== "identified" || !foundCompetitors || !targetUrl) return;
    const myId = ++requestIdRef.current;
    setPhase("analyzing");
    setAnalyzeError(null);
    try {
      const [res] = await Promise.all([
        fetch(`/api/analyze${MOCK_QUERY}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: targetUrl, competitors: foundCompetitors }),
        }),
        new Promise((r) => setTimeout(r, 7200)),
      ]);
      if (myId !== requestIdRef.current) return;

      console.log("analyze status:", res.status);
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        /* non-JSON response (likely HTML error page or timeout) */
      }
      console.log("analyze data:", data);

      if (myId !== requestIdRef.current) return;

      if (!res.ok) {
        const detail =
          (data as { detail?: string; error?: string } | null)?.detail ??
          (data as { detail?: string; error?: string } | null)?.error ??
          raw.slice(0, 200) ??
          `HTTP ${res.status}`;
        setAnalyzeError(`Analysis failed (${res.status}): ${detail}`);
        setPhase("identified");
        return;
      }

      const analysis = data as AnalysisData | null;
      if (
        !analysis ||
        !analysis.recommendations ||
        analysis.recommendations.length === 0
      ) {
        setAnalyzeError("Analysis returned no insights. Try again.");
        setPhase("identified");
        return;
      }

      onAnalyzeComplete?.({ ...analysis, url: targetUrl });
      setPhase("idle");
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : String(err);
      console.error("Analyze failed:", err);
      setAnalyzeError(`Analysis failed: ${message}`);
      setPhase("identified");
    }
  }

  useEffect(() => {
    if (phase === "identifying" || phase === "analyzing") return;
    const trimmed = url.trim();
    if (!looksLikeUrl(trimmed)) return;
    if (trimmed === lastIdentifiedUrlRef.current) return;
    const t = setTimeout(() => {
      void runIdentify(trimmed);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "identified") void runAnalyze();
  };

  const handleStop = () => {
    requestIdRef.current++;
    setPhase("idle");
    setUrl("");
    setFoundCompetitors(null);
    setAnalyzeError(null);
    lastIdentifiedUrlRef.current = null;
  };

  const handleRegenerate = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    requestIdRef.current++;
    lastIdentifiedUrlRef.current = null;
    setAnalyzeError(null);
    void runIdentify(trimmed);
  };

  const handleRemoveCompetitor = (domain: string) => {
    setFoundCompetitors((prev) => {
      const list = prev ?? FALLBACK_COMPETITORS;
      return list.filter((c) => c.domain !== domain);
    });
  };

  const isProcessing = phase === "identifying" || phase === "analyzing";
  const showLogos = phase === "identified" || phase === "analyzing";
  const showStartButton = phase === "identified";
  const showShimmer = isProcessing;
  const showStopRegen = phase !== "idle";
  const competitorsToShow = foundCompetitors ?? FALLBACK_COMPETITORS;
  const shimmerText =
    phase === "identifying"
      ? "Looking for competitors"
      : ANALYZE_PHASES[phaseIdx];

  return (
    <section
      id="input-section"
      className="relative h-screen w-full overflow-hidden bg-black px-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, #000 0%, #000 35%, rgba(64, 44, 120, 0.22) 85%, rgba(28, 18, 55, 0.12) 100%), radial-gradient(ellipse 90% 50% at 50% 110%, rgba(80, 55, 145, 0.35) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute left-1/2 z-10 flex w-full max-w-2xl -translate-x-1/2 flex-col items-center"
        style={{ top: "calc(50% + 70px)" }}
      >
        <div
          className="flex items-center gap-3 transition-opacity duration-500"
          style={{ opacity: showLogos ? 1 : 0 }}
          aria-hidden={!showLogos}
        >
          {competitorsToShow.slice(0, 3).map((c) => (
            <div
              key={c.domain}
              className="flex items-center gap-2 rounded-full border border-white/30 transition-colors hover:border-white/60"
              style={{ padding: "6px 14px" }}
            >
              <span
                className="text-white"
                style={{ fontSize: 14, fontWeight: 400 }}
              >
                {c.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCompetitor(c.domain)}
                aria-label={`Remove ${c.name}`}
                className="text-white/50 transition-colors hover:text-white/90 focus-visible:outline focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                style={{ fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex w-full flex-col items-center gap-5"
        >
          <div className="input-blob-border-ring flex min-h-[52px] w-full min-w-0 items-stretch overflow-hidden rounded-full">
            <div className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[#141414] py-2 pl-5 pr-2">
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Drop your URL here"
                readOnly={phase === "analyzing"}
                className="min-w-0 flex-1 bg-transparent text-white placeholder-white/40 outline-none read-only:cursor-not-allowed"
                style={{ fontWeight: 300, fontSize: 15 }}
              />
              <div
                className="flex shrink-0 items-center gap-0.5 transition-opacity duration-300"
                style={{
                  opacity: showStopRegen ? 1 : 0,
                  pointerEvents: showStopRegen ? "auto" : "none",
                }}
                aria-hidden={!showStopRegen}
              >
                <button
                  type="button"
                  onClick={handleStop}
                  tabIndex={showStopRegen ? 0 : -1}
                  aria-label="Stop"
                  title="Stop"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:ring-1 focus-visible:ring-white/35"
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
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" />
                    <rect
                      x="9"
                      y="9"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  tabIndex={showStopRegen ? 0 : -1}
                  aria-label="Regenerate"
                  title="Regenerate"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:ring-1 focus-visible:ring-white/35"
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
                    aria-hidden
                  >
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <path d="M22 3v6h-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex h-12 w-full items-center justify-center">
            <button
              type="submit"
              disabled={!showStartButton}
              aria-hidden={!showStartButton}
              tabIndex={showStartButton ? 0 : -1}
              aria-label="Start analysis"
              className="group absolute inline-flex items-stretch overflow-hidden rounded-full border border-white transition-opacity duration-[400ms] ease-out"
              style={{
                opacity: showStartButton ? 1 : 0,
                pointerEvents: showStartButton ? "auto" : "none",
              }}
            >
              <span
                className="flex min-h-[48px] items-center justify-center bg-white px-6 py-3 text-center text-black transition-colors group-hover:bg-white/90"
                style={{ fontWeight: 400, fontSize: 15 }}
              >
                Start analysis
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
              </span>
            </button>

            <div
              className="pointer-events-none absolute flex items-center justify-center transition-opacity duration-[400ms] ease-out"
              style={{ opacity: showShimmer ? 1 : 0 }}
              aria-hidden={!showShimmer}
              aria-live="polite"
            >
              <span
                className="thinking-shimmer"
                style={{
                  fontWeight: 400,
                  fontSize: 14,
                  letterSpacing: "0.01em",
                }}
              >
                {shimmerText}
              </span>
            </div>
          </div>

          {analyzeError && (
            <div
              className="max-w-full text-center"
              role="alert"
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgb(248, 113, 113)",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              {analyzeError}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
