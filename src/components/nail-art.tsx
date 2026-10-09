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

// Logo mark: a Cormorant Garamond "L" (outlined to a path, so the favicon
// needs no web font) with a sparkle. src/app/icon.svg is the same drawing.
const MONOGRAM =
  "M25.57 25.02L25.57 25.02L25.57 46.09Q25.57 47.29 25.83 47.91Q26.08 48.53 26.79 48.73Q27.51 48.94 28.93 48.94L28.93 48.94L32.84 48.94Q35.83 48.94 37.72 47.19Q39.60 45.45 40.20 42.55L40.20 42.55Q40.20 42.41 40.45 42.43Q40.71 42.46 40.71 42.59L40.71 42.59Q40.57 43.93 40.43 45.81Q40.29 47.70 40.29 49.31L40.29 49.31Q40.29 50 39.60 50L39.60 50L18.17 50Q18.07 50 18.07 49.72Q18.07 49.45 18.17 49.45L18.17 49.45Q19.78 49.45 20.58 49.22Q21.39 48.99 21.66 48.30Q21.94 47.61 21.94 46.27L21.94 46.27L21.94 24.98Q21.94 23.64 21.66 22.98Q21.39 22.31 20.58 22.05Q19.78 21.80 18.17 21.80L18.17 21.80Q18.07 21.80 18.07 21.53Q18.07 21.25 18.17 21.25L18.17 21.25Q19.27 21.25 20.72 21.32Q22.17 21.39 23.73 21.39L23.73 21.39Q25.39 21.39 26.79 21.32Q28.20 21.25 29.30 21.25L29.30 21.25Q29.39 21.25 29.39 21.53Q29.39 21.80 29.30 21.80L29.30 21.80Q27.69 21.80 26.91 22.05Q26.13 22.31 25.85 23.00Q25.57 23.69 25.57 25.02Z";

const LogoMark = ({ className }: Readonly<{ className?: string }>) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="18" fill="#4a0d1c" />
    <path
      d={MONOGRAM}
      fill="#cf8e80"
      stroke="#cf8e80"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <path d={sparklePath(47, 19, 5.5)} fill="#ebc9c1" />
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
