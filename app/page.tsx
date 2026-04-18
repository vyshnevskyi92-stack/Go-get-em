"use client";

import { useEffect, useState } from "react";
import HeroStoryWrapper from "./components/HeroStoryWrapper";
import ResultsSection from "./components/ResultsSection";
import type { AnalysisData } from "./lib/types";

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (!analysis) return;
    // Small delay so ResultsSection can unhide (height 0 → auto) and Lenis's
    // ResizeObserver picks up the new document height before we scroll.
    const timeout = setTimeout(() => {
      window.scrollToResults?.();
    }, 180);
    return () => clearTimeout(timeout);
  }, [analysis]);

  return (
    <main>
      <HeroStoryWrapper onAnalyzeComplete={(data) => setAnalysis(data)} />
      <ResultsSection show={!!analysis} data={analysis} />
    </main>
  );
}
