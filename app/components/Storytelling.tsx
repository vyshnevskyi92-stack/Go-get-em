"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

type Panel = {
  label: string;
  tag: string;
  headline: string;
  body: string;
  large: string;
};

const panels: Panel[] = [
  {
    label: "01",
    tag: "Problem",
    headline: "Most teams struggle to understand why competitors outperform them.",
    body: "The best ones know.",
    large: "See where you fall behind.",
  },
  {
    label: "02",
    tag: "Solution",
    headline: "We identify your competitors, analyze their pages,",
    body: "and benchmark everything automatically",
    large: "Benchmarked against best.",
  },
  {
    label: "03",
    tag: "Result",
    headline: "'Improve your CTA' is not advice.",
    body: "We tell you what your top competitor says instead, and why theirs converts better.",
    large: "Changes you can ship today.",
  },
];

function StoryPanel({
  panel,
  opacity,
  y,
}: {
  panel: Panel;
  opacity: MotionValue<number>;
  y?: MotionValue<string>;
}) {
  const visibility = useTransform(opacity, (v) =>
    v > 0.01 ? "visible" : "hidden",
  );
  return (
    <motion.div
      style={{ opacity, visibility, y }}
      className="pointer-events-none absolute inset-0"
    >
      <span
        className="absolute left-8 top-10 md:left-16 md:top-16"
        style={{
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: "0.14em",
          opacity: 0.45,
          textTransform: "uppercase",
        }}
      >
        {panel.label}
      </span>

      <div
        className="absolute top-1/2 left-8 max-w-md -translate-y-1/2 md:left-16"
        style={{ pointerEvents: "auto" }}
      >
        <span
          className="inline-block rounded-full border border-white/40"
          style={{
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 400,
            color: "#ffffff",
            letterSpacing: "0.02em",
          }}
        >
          {panel.tag}
        </span>
        <p
          className="mt-5"
          style={{
            fontWeight: 300,
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {panel.headline} {panel.body}
        </p>
      </div>

      <div
        className="absolute top-1/2 right-8 max-w-md -translate-y-1/2 text-left md:right-16"
        style={{ pointerEvents: "auto" }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "clamp(2rem, 5vw, 64px)",
            letterSpacing: "-0.035em",
            lineHeight: 1.11,
            color: "#ffffff",
          }}
        >
          {panel.large}
        </h2>
      </div>
    </motion.div>
  );
}

export default function Storytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Tracks the post-sticky scroll: 0 when sticky releases, 1 when the section
  // has scrolled fully past the top of the viewport. Used to keep panel 3
  // centered with the blob and then fade it out before InputSection arrives.
  const { scrollYProgress: postStickyProgress } = useScroll({
    target: containerRef,
    offset: ["end end", "end start"],
  });

  const opacity01 = useTransform(
    scrollYProgress,
    [0, 0.31, 0.33, 1],
    [1, 1, 0, 0],
  );
  const opacity02 = useTransform(
    scrollYProgress,
    [0, 0.31, 0.33, 0.65, 0.67, 1],
    [0, 0, 1, 1, 0, 0],
  );
  const opacity03Base = useTransform(
    scrollYProgress,
    [0, 0.65, 0.67, 1],
    [0, 0, 1, 1],
  );
  const panel3PostFade = useTransform(
    postStickyProgress,
    [0, 0.7, 1],
    [1, 1, 0],
  );
  const opacity03 = useTransform<number, number>(
    [opacity03Base, panel3PostFade],
    ([base, fade]) => base * fade,
  );
  const panel3Y = useTransform(
    postStickyProgress,
    [0, 1],
    ["0vh", "100vh"],
  );

  const opacities = [opacity01, opacity02, opacity03];

  return (
    <section
      ref={containerRef}
      id="story-01"
      className="relative bg-black"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 h-screen w-full">
        <div className="relative z-10 h-full w-full">
          {panels.map((p, i) => (
            <StoryPanel
              key={p.label}
              panel={p}
              opacity={opacities[i]}
              y={i === 2 ? panel3Y : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
