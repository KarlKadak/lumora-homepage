import type { CSSProperties } from "react";

// An almond nail, tip up, centred on the origin.
const NAIL =
  "M-24 52V-6C-24-40-10-62 0-70C10-62 24-40 24-6V52C24 64-24 64-24 52Z";
const CUTICLE = "M-17 38C-17 24 17 24 17 38";
const GLOSS = "M-11-14C-11-32-6-44 0-52";

// Animation delay for the CSS classes in globals.css. Hero timings are
// relative to --hero-delay, which skips past the intro on repeat visits.
const delay = (seconds: number, afterIntro = true): CSSProperties => {
  const value =
    afterIntro ?
      `calc(var(--hero-delay) + ${String(seconds)}s)`
    : `${String(seconds)}s`;
  const style: Record<string, string> = { "--d": value };

  return style;
};

const sparklePath = (x: number, y: number, size: number) => {
  const [top, right, bottom, left] = [y - size, x + size, y + size, x - size];

  return `M${String(x)} ${String(top)}Q${String(x)} ${String(y)} ${String(right)} ${String(y)}Q${String(x)} ${String(y)} ${String(x)} ${String(bottom)}Q${String(x)} ${String(y)} ${String(left)} ${String(y)}Q${String(x)} ${String(y)} ${String(x)} ${String(top)}Z`;
};

// Full-screen intro: one nail is outlined, brushed with polish from cuticle to
// tip, catches a glint, then the curtain lifts. Pure CSS, plays once per tab.
const IntroOverlay = () => (
  <div
    aria-hidden="true"
    className="intro-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-burgundy-deep"
  >
    <svg
      viewBox="-60 -90 120 170"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-28 sm:w-36"
    >
      <defs>
        <clipPath id="intro-nail-clip">
          <path d={NAIL} />
        </clipPath>
      </defs>
      <g clipPath="url(#intro-nail-clip)">
        <rect
          x="-30"
          y="-75"
          width="60"
          height="140"
          className="nail-polish fill-rose"
          style={delay(0.95, false)}
        />
      </g>
      <path
        d={NAIL}
        pathLength={1}
        className="nail-draw stroke-rose-soft"
        strokeWidth="1.5"
        style={delay(0.1, false)}
      />
      <path
        d={GLOSS}
        className="nail-gloss stroke-white"
        strokeWidth="2.5"
        opacity="0.8"
        style={delay(1.55, false)}
      />
      <path
        d={sparklePath(40, -60, 9)}
        className="sparkle fill-rose-soft"
        style={delay(1.65, false)}
      />
      <path
        d={sparklePath(-42, -20, 6)}
        className="sparkle fill-rose-soft"
        style={delay(1.8, false)}
      />
    </svg>
    <p
      className="rise mt-8 font-serif text-4xl tracking-wide text-rose-soft"
      style={delay(0.5, false)}
    >
      Lumora
    </p>
    <p
      className="rise mt-2 text-[0.65rem] tracking-[0.4em] text-rose uppercase"
      style={delay(0.65, false)}
    >
      Nail Lounge
    </p>
  </div>
);

// A single almond nail, used as a small ornament.
const NailGlyph = ({ className }: Readonly<{ className?: string }>) => (
  <svg viewBox="-26 -72 52 136" className={className} aria-hidden="true">
    <path d={NAIL} />
  </svg>
);

// Temporary logo mark; src/app/icon.svg is the same drawing as the favicon.
const LogoMark = ({ className }: Readonly<{ className?: string }>) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect
      x="0.75"
      y="0.75"
      width="62.5"
      height="62.5"
      rx="18"
      fill="#4a0d1c"
      stroke="#cf8e80"
      strokeOpacity="0.5"
      strokeWidth="1.5"
    />
    <g transform="translate(30 36) scale(0.37)">
      <path d={NAIL} fill="#cf8e80" />
      <path
        d={GLOSS}
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
    <path d={sparklePath(47, 17, 5)} fill="#ebc9c1" />
  </svg>
);

// A slowly turning ring of text, like a stamp on the hero arch.
const BadgeRing = ({ text }: Readonly<{ text: string }>) => (
  <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
    <defs>
      <path id="badge-ring" d="M60 14a46 46 0 1 1 0 92a46 46 0 1 1 0-92" />
    </defs>
    <g className="origin-center animate-spin-slow">
      <text className="fill-burgundy-deep text-[9.6px] font-semibold tracking-[0.3em] uppercase">
        <textPath href="#badge-ring" textLength="284" lengthAdjust="spacing">
          {text}
        </textPath>
      </text>
    </g>
    <path d={sparklePath(60, 60, 12)} className="fill-burgundy-deep" />
  </svg>
);

export {
  BadgeRing,
  CUTICLE,
  delay,
  GLOSS,
  IntroOverlay,
  LogoMark,
  NAIL,
  NailGlyph,
  sparklePath,
};
