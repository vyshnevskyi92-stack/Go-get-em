"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import Hero from "./Hero";
import Storytelling from "./Storytelling";
import InputSection from "./InputSection";
import SplineBlob from "./SplineBlob";

import type { AnalysisData } from "../lib/types";

export default function HeroStoryWrapper({
  onAnalyzeComplete,
}: {
  onAnalyzeComplete?: (data: AnalysisData) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sections inside this wrapper:
  //   Hero           100vh   progress 0.0 – 0.2
  //   Storytelling   300vh   progress 0.2 – 0.8
  //   InputSection   100vh   progress 0.8 – 1.0

  const left = useTransform(
    scrollYProgress,
    [0, 0.18, 0.26, 1],
    ["27%", "27%", "50%", "50%"],
  );

  const baseScale = useTransform(
    scrollYProgress,
    [0, 0.10, 0.20, 0.95, 1],
    [1, 1, 0.5, 0.5, 1],
  );

  // Shrinks the blob when competitors render, so the pills under it breathe.
  const analyzingModifier = useMotionValue(1);
  useEffect(() => {
    const controls = animate(analyzingModifier, isAnalyzing ? 0.32 : 1, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [isAnalyzing, analyzingModifier]);

  const scale = useTransform<number, number>(
    [baseScale, analyzingModifier],
    ([b, m]) => b * m,
  );

  // Vertical position. Base follows scroll; analyzing shift lifts the blob
  // 10vh upward to make room for the competitor pills below it.
  const baseTopVh = useTransform(scrollYProgress, [0, 1], [50, 450]);
  const analyzingTopOffset = useMotionValue(0);
  useEffect(() => {
    const controls = animate(analyzingTopOffset, isAnalyzing ? -10 : 0, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [isAnalyzing, analyzingTopOffset]);

  const top = useTransform<number, string>(
    [baseTopVh, analyzingTopOffset],
    ([t, off]) => `${t + off}vh`,
  );

  return (
    <div ref={containerRef} className="relative">
      <Hero />
      <Storytelling />
      <InputSection
        onAnalyzeComplete={onAnalyzeComplete}
        onAnalyzingChange={setIsAnalyzing}
      />
      <motion.div
        style={{
          position: "absolute",
          top,
          left,
          x: "-50%",
          y: "-50%",
          scale,
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <SplineBlob size={450} />
      </motion.div>
    </div>
  );
}
