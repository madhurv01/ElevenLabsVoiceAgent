"use client";

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-radiant-gradient">
      <div
        className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full opacity-40 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, #b394ff 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full opacity-40 blur-3xl animate-blob-slow"
        style={{ background: "radial-gradient(circle, #5da8ff 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full opacity-30 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, #4fe0c5 0%, transparent 70%)", animationDelay: "-8s" }}
      />
      <div
        className="absolute bottom-0 right-1/3 w-[40vw] h-[40vw] rounded-full opacity-30 blur-3xl animate-blob-slow"
        style={{ background: "radial-gradient(circle, #ff8fd6 0%, transparent 70%)", animationDelay: "-4s" }}
      />

      {/* subtle grain/noise for a premium, non-flat feel */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
