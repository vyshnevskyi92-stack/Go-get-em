"use client";

import { useEffect } from "react";

export default function EmailGateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{ background: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-gate-title"
    >
      <div
        className="relative w-full"
        style={{
          background: "#111111",
          borderRadius: 16,
          padding: 48,
          maxWidth: 560,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="email-gate-title"
          style={{
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
          }}
        >
          Your full report is on its way.
        </h3>
        <p
          className="mt-4"
          style={{
            fontWeight: 300,
            fontSize: 15,
            opacity: 0.7,
            lineHeight: 1.55,
          }}
        >
          This one&apos;s unlocked. Most teams stop here.
        </p>

        <div className="mt-8 h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />

        <h4
          className="mt-8"
          style={{
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Don&apos;t stop at one page.
        </h4>
        <p
          className="mt-2"
          style={{
            fontWeight: 300,
            fontSize: 14,
            opacity: 0.6,
            lineHeight: 1.55,
          }}
        >
          Continuous analysis based on patterns across high-performing SaaS pages.
        </p>

        <div className="mt-6 grid grid-cols-2 items-stretch gap-4">
          <PricingCard
            label="Monthly"
            price="$12"
            cadence="/month"
            lines={["Unlimited analyses", "Cancel anytime"]}
          />
          <PricingCard
            label="Yearly"
            price="$100"
            cadence="/year"
            lines={["Unlimited analyses", "2 months free", "Best value"]}
            recommended
            selected
          />
        </div>

        <p
          className="mt-6"
          style={{
            fontWeight: 300,
            fontSize: 14,
            opacity: 0.5,
            lineHeight: 1.55,
          }}
        >
          Run analyses across multiple pages, funnels, and iterations.
        </p>
        <p
          className="mt-1"
          style={{
            fontWeight: 300,
            fontSize: 14,
            opacity: 0.5,
            lineHeight: 1.55,
          }}
        >
          1-day free. Cancel before it ends — pay nothing.
        </p>

        <div className="mt-8 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white/90"
            style={{ fontSize: 13, fontWeight: 300 }}
          >
            Continue with one report
          </button>
          <span
            style={{
              fontSize: 11,
              opacity: 0.35,
              fontWeight: 300,
              letterSpacing: "0.01em",
            }}
          >
            No ongoing access.
          </span>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  label,
  price,
  cadence,
  lines,
  recommended = false,
  selected = false,
}: {
  label: string;
  price: string;
  cadence: string;
  lines: string[];
  recommended?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl transition-opacity duration-300 ${
        selected
          ? "input-blob-border-ring"
          : "border border-white/[0.08]"
      } ${selected ? "" : "opacity-[0.82]"}`}
      data-selected={selected || undefined}
    >
      <div
        className={`relative flex h-full min-h-0 flex-col rounded-[11px] p-5 ${
          selected
            ? "bg-[#141414] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "bg-[#0c0c0c]"
        }`}
      >
        {recommended && (
          <span
            className="absolute right-3 top-3 rounded-full"
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.85)",
              padding: "3px 8px",
            }}
          >
            Recommended
          </span>
        )}
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            opacity: selected ? 0.5 : 0.35,
            letterSpacing: "0.1em",
            fontWeight: 400,
          }}
        >
          {label}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span
            style={{
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "-0.02em",
              opacity: selected ? 1 : 0.92,
            }}
          >
            {price}
          </span>
          <span style={{ fontSize: 13, opacity: 0.5, fontWeight: 300 }}>
            {cadence}
          </span>
        </div>
        <ul className="mt-4 flex flex-col gap-1.5">
          {lines.map((l) => (
            <li
              key={l}
              style={{
                fontSize: 13,
                opacity: selected ? 0.78 : 0.65,
                fontWeight: 300,
                lineHeight: 1.4,
              }}
            >
              {l}
            </li>
          ))}
        </ul>
        <div className="mt-auto w-full pt-4">
          <button
            type="button"
            className="w-full rounded-full bg-white py-3 text-black transition-colors hover:bg-white/90"
            style={{ fontWeight: 500, fontSize: 14 }}
            aria-label="Start free trial"
          >
            Start free trial
          </button>
        </div>
      </div>
    </div>
  );
}
