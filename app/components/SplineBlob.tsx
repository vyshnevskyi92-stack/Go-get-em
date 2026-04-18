"use client";

type Props = {
  size: number;
  className?: string;
  analyzing?: boolean;
};

export default function SplineBlob({
  size,
  className = "",
  analyzing = false,
}: Props) {
  return (
    <div
      className={`blob-wrapper blob-frame ${analyzing ? "analyzing" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <iframe
        src="https://my.spline.design/blobs-4a9gBd6r1mkbDbdGhq34Bps1/?mute=1&audio=0&muted=true"
        // Permissions Policy: explicitly block autoplay + any audio-capable
        // features so the Spline scene can't play sound.
        allow="autoplay=(); microphone=(); camera=(); fullscreen=()"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          filter:
            "sepia(1) hue-rotate(240deg) saturate(5) brightness(1.15) contrast(1.1)",
        }}
        title="3D blob"
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, #080808 70%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          background: "#080808",
          zIndex: 10,
        }}
      />
    </div>
  );
}
