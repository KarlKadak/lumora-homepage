import { NAIL, sparklePath } from "@/components/nail-art";

// The finishes the hero brush cycles through. Each is a polish `paint` (a
// plain colour or a gradient defined below) and, for the decorated ones, a
// `decor` overlay that is laid on top once the coat is on. Decor is drawn in
// a nail's own coordinates: the almond is 48 wide (x from -24 to 24), the
// cuticle sits near y = 52 and the tip at y = -70.

interface Finish {
  name: string;
  paint: string;
  decor?: string;
  // Freshly added to the menu, flagged as such in the picker.
  isNew?: boolean;
}

const gradient = (id: string) => `url(#hero-paint-${id})`;

// The first finish opens every visit; the rest follow in a random order.
const FINISHES: readonly Finish[] = [
  { name: "halloween", paint: "#f07b2a", decor: "halloween", isNew: true },
  {
    name: "halloween-night",
    paint: "#3b1a5e",
    decor: "halloween-night",
    isNew: true,
  },
  // Everyday shades.
  { name: "rose", paint: "var(--color-rose)" },
  { name: "chrome", paint: gradient("chrome") },
  { name: "french", paint: "#f3d9d0", decor: "french" },
  { name: "cherry", paint: "#a3122c" },
  { name: "glitter", paint: "var(--color-plum)", decor: "glitter" },
  { name: "sunset", paint: gradient("sunset") },
  { name: "polka", paint: "var(--color-pearl)", decor: "polka" },
  { name: "nude", paint: "#d9b3a2" },
  { name: "ombre", paint: gradient("ombre") },
  { name: "winter", paint: "#bfd9ea", decor: "snow" },
  { name: "ink", paint: "#1c1118" },
  { name: "cat-eye", paint: gradient("cat-eye") },
  { name: "leopard", paint: "#e2b98a", decor: "leopard" },
  { name: "lavender", paint: "#b9a3d6" },
  { name: "candy", paint: gradient("candy") },
  { name: "marble", paint: "var(--color-pearl)", decor: "marble" },
  { name: "sage", paint: "#9db59a" },
  { name: "valentine", paint: "#f0a7b6", decor: "hearts" },
  { name: "aurora", paint: gradient("aurora") },
  { name: "half-moon", paint: "var(--color-burgundy)", decor: "half-moon" },
  { name: "rose-soft", paint: "var(--color-rose-soft)" },
  { name: "galaxy", paint: gradient("galaxy"), decor: "stars" },
  { name: "gold-foil", paint: "#2c1a2e", decor: "foil" },
  { name: "holo", paint: gradient("holo") },
  { name: "festive", paint: "#1f5a3a", decor: "festive" },
  { name: "ocean", paint: gradient("ocean") },
  { name: "stripes", paint: "#fff2ef", decor: "stripes" },
  { name: "pearl", paint: "var(--color-pearl)" },
];

const isGradient = (paint: string) => paint.startsWith("url(");

// A small heart, point down, centred on (x, y).
const heartPath = (x: number, y: number, size: number) => {
  const s = size;

  return `M${String(x)} ${String(y + s)}C${String(x - s * 1.6)} ${String(y - s * 0.2)} ${String(x - s * 0.9)} ${String(y - s * 1.3)} ${String(x)} ${String(y - s * 0.4)}C${String(x + s * 0.9)} ${String(y - s * 1.3)} ${String(x + s * 1.6)} ${String(y - s * 0.2)} ${String(x)} ${String(y + s)}Z`;
};

// A bat in flight, wings spread, centred on (x, y) and scaled by `size`.
const batPath = (x: number, y: number, size: number) => {
  const p = (dx: number, dy: number) =>
    `${(x + dx * size).toFixed(1)} ${(y + dy * size).toFixed(1)}`;

  return `M${p(0, 0)}C${p(-2, -4)} ${p(-5, -6)} ${p(-9, -6)}C${p(-13, -6)} ${p(-16, -3)} ${p(-18, 1)}C${p(-15, -1)} ${p(-12, -1)} ${p(-10, 1)}C${p(-7, 0)} ${p(-4, 2)} ${p(-2, 6)}C${p(-1, 4)} ${p(1, 4)} ${p(2, 6)}C${p(4, 2)} ${p(7, 0)} ${p(10, 1)}C${p(12, -1)} ${p(15, -1)} ${p(18, 1)}C${p(16, -3)} ${p(13, -6)} ${p(9, -6)}C${p(5, -6)} ${p(2, -4)} ${p(0, 0)}Z`;
};

// Deterministic scatter, so the server and client render the same markup.
// Low-discrepancy sequences spread the specks evenly without a visible grid.
const fraction = (value: number) => value - Math.floor(value);
const scatter = (count: number, seed: number) =>
  Array.from({ length: count }, (_, index) => ({
    x: -20 + fraction((index + 1) * 0.754_878 + seed * 0.37) * 40,
    y: -58 + fraction((index + 1) * 0.569_84 + seed * 0.59) * 104,
    r: fraction((index + 1) * 0.414_214 + seed * 0.83),
  }));

const GLITTER = scatter(28, 1);
const STARS = scatter(14, 2);
const FOIL = scatter(9, 3);
const SNOW = scatter(7, 4);

const LEOPARD_SPOTS = [
  { x: -12, y: -40, r: 5 },
  { x: 10, y: -28, r: 6 },
  { x: -8, y: -8, r: 6 },
  { x: 13, y: 4, r: 5 },
  { x: -14, y: 24, r: 5 },
  { x: 6, y: 34, r: 6 },
];

// Rows of dots, every other row shifted so they sit in a diamond grid.
const POLKA = [-40, -22, -4, 14, 32, 50].flatMap((y, row) =>
  (row % 2 ? [-15, 0, 15] : [-7.5, 7.5]).map((x) => ({ x, y })),
);

// Halloween: polish dripping down from the tip, bats, and a jack-o'-lantern
// grinning near the cuticle.
const HalloweenDecor = ({
  id,
  drip,
  bat,
}: Readonly<{ id: string; drip: string; bat: string }>) => (
  <g id={`hero-decor-${id}`} stroke="none">
    <path
      d="M-30-80H30V-36C27-36 26-20 22-20C18-20 18-40 14-40C10-40 11-14 6-14C1-14 2-44-4-44C-9-44-8-28-13-28C-18-28-17-46-22-46C-26-46-26-34-30-34Z"
      fill={drip}
    />
    <path d={batPath(2, 2, 1)} fill={bat} />
    <path d={batPath(-11, -8, 0.55)} fill={bat} opacity="0.85" />
    <g transform="translate(4 36)">
      <path d="M-1-11C-1-15 2-16 4-16C2-15 1-13 1-11Z" fill="#2f6b2e" />
      <ellipse cx="0" cy="0" rx="12" ry="10" fill="#c24a12" />
      <ellipse cx="-5" cy="0" rx="4.5" ry="10" fill="#d9601e" />
      <ellipse cx="5" cy="0" rx="4.5" ry="10" fill="#d9601e" />
      <ellipse cx="0" cy="0" rx="3" ry="10" fill="#e8762a" />
      <path d="M-7-3L-3-1L-7 1Z M7-3L3-1L7 1Z" fill="#1c1118" />
      <path d="M-7 3C-4 7 4 7 7 3L5 4L3 6L1 4L-1 6L-3 4L-5 5Z" fill="#1c1118" />
    </g>
  </g>
);

// A single nail wearing a finish, for the picker. It borrows the hero's
// clip, gradients and decor, which share the document.
const FinishSwatch = ({
  finish,
  className,
}: Readonly<{ finish: Finish; className?: string }>) => (
  <svg viewBox="-30 -78 60 148" className={className} aria-hidden="true">
    <g clipPath="url(#hero-nail-clip)">
      <rect x="-30" y="-75" width="60" height="140" fill={finish.paint} />
      {finish.decor && <use href={`#hero-decor-${finish.decor}`} />}
    </g>
    <path
      d={NAIL}
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.5"
    />
  </svg>
);

// Gradients and overlays for the hero's `defs`. The gradients use the nail's
// bounding box, so they turn with the nail; the brush bristles and the bottle
// borrow the same ones.
const HeroFinishDefs = () => (
  <>
    <linearGradient id="hero-paint-chrome" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fbf5f3" />
      <stop offset="0.45" stopColor="#ebc9c1" />
      <stop offset="0.7" stopColor="#cf8e80" />
      <stop offset="1" stopColor="#fbf5f3" />
    </linearGradient>
    {/* Tip to cuticle: a classic ombré. */}
    <linearGradient id="hero-paint-ombre" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.1" stopColor="#fbf5f3" />
      <stop offset="0.9" stopColor="#cf8e80" />
    </linearGradient>
    {/* Cuticle to tip, the other way round and warmer. */}
    <linearGradient id="hero-paint-sunset" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#f6c177" />
      <stop offset="0.5" stopColor="#ec7a62" />
      <stop offset="1" stopColor="#8a2c62" />
    </linearGradient>
    {/* A steep diagonal. */}
    <linearGradient id="hero-paint-candy" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stopColor="#ffd3e0" />
      <stop offset="0.5" stopColor="#ff8fb1" />
      <stop offset="1" stopColor="#c94f7c" />
    </linearGradient>
    {/* Side to side. */}
    <linearGradient id="hero-paint-ocean" x1="1" y1="0" x2="0" y2="0.3">
      <stop offset="0" stopColor="#0f3d5e" />
      <stop offset="0.55" stopColor="#2f8f9d" />
      <stop offset="1" stopColor="#b9ecee" />
    </linearGradient>
    {/* Cat-eye: a bright magnetic band down the middle. */}
    <linearGradient id="hero-paint-cat-eye" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stopColor="#2b1631" />
      <stop offset="0.42" stopColor="#5a3a74" />
      <stop offset="0.5" stopColor="#d7b6ff" />
      <stop offset="0.58" stopColor="#5a3a74" />
      <stop offset="1" stopColor="#2b1631" />
    </linearGradient>
    {/* Holographic: a shallow diagonal of pastel bands. */}
    <linearGradient id="hero-paint-holo" x1="0" y1="0.2" x2="1" y2="0.8">
      <stop offset="0" stopColor="#ffd0e5" />
      <stop offset="0.25" stopColor="#fff3b0" />
      <stop offset="0.5" stopColor="#c3f5e2" />
      <stop offset="0.75" stopColor="#c7d4ff" />
      <stop offset="1" stopColor="#f2c6ff" />
    </linearGradient>
    {/* Aurora: a soft radial glow off-centre near the tip. */}
    <radialGradient id="hero-paint-aurora" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stopColor="#c8f3e6" />
      <stop offset="0.5" stopColor="#7fb8c9" />
      <stop offset="1" stopColor="#3b2a6b" />
    </radialGradient>
    {/* Galaxy: deep at the edges, a nebula glow near the cuticle. */}
    <radialGradient id="hero-paint-galaxy" cx="0.55" cy="0.7" r="0.8">
      <stop offset="0" stopColor="#6b2d7a" />
      <stop offset="0.6" stopColor="#2a1646" />
      <stop offset="1" stopColor="#120a22" />
    </radialGradient>

    <g id="hero-decor-french" stroke="none">
      <path
        d="M-30-80H30V-24C18-26 8-40 0-44C-8-40-18-26-30-24Z"
        fill="#fbf5f3"
      />
      <path
        d="M-30-24C-18-26-8-40 0-44C8-40 18-26 30-24"
        fill="none"
        stroke="#cf8e80"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
    </g>
    <g id="hero-decor-half-moon" stroke="none">
      <path d="M-30 80H30V34C18 20-18 20-30 34Z" fill="#fbf5f3" />
    </g>
    <g id="hero-decor-polka" stroke="none" fill="#4a0d1c">
      {POLKA.map(({ x, y }) => (
        <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="3.2" />
      ))}
    </g>
    <g id="hero-decor-glitter" stroke="none" fill="#ffffff">
      {GLITTER.map(({ x, y, r }, index) => (
        <circle
          key={index}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={(0.6 + r * 1.4).toFixed(1)}
          opacity={(0.4 + r * 0.6).toFixed(2)}
        />
      ))}
    </g>
    <g id="hero-decor-stars" stroke="none" fill="#ffffff">
      {STARS.map(({ x, y, r }, index) =>
        r > 0.7 ?
          <path
            key={index}
            d={sparklePath(x, y, 2 + r * 3)}
            opacity={(0.7 + r * 0.3).toFixed(2)}
          />
        : <circle
            key={index}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={(0.5 + r).toFixed(1)}
            opacity={(0.5 + r * 0.5).toFixed(2)}
          />,
      )}
    </g>
    <g id="hero-decor-foil" stroke="none" fill="#e9c46a">
      {FOIL.map(({ x, y, r }, index) => (
        <path
          key={index}
          d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(3 + r * 4).toFixed(1)} ${(1 - r * 3).toFixed(1)}l${(-1 - r * 2).toFixed(1)} ${(3 + r * 3).toFixed(1)}l${(-3 - r * 2).toFixed(1)} ${(-0.5 + r).toFixed(1)}z`}
          opacity={(0.75 + r * 0.25).toFixed(2)}
        />
      ))}
    </g>
    <g id="hero-decor-snow" stroke="none" fill="#ffffff">
      {SNOW.map(({ x, y, r }, index) => (
        <path
          key={index}
          d={sparklePath(x, y, 3 + r * 3)}
          opacity={(0.8 + r * 0.2).toFixed(2)}
        />
      ))}
    </g>
    <g id="hero-decor-hearts" stroke="none" fill="#a3122c">
      <path d={heartPath(-9, -30, 4)} />
      <path d={heartPath(10, -6, 5)} />
      <path d={heartPath(-8, 22, 4.5)} />
      <path d={heartPath(11, 40, 3.5)} opacity="0.8" />
    </g>
    <g id="hero-decor-leopard" stroke="none">
      {LEOPARD_SPOTS.map(({ x, y, r }) => (
        <g key={`${String(x)}-${String(y)}`}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="#b8743f" />
          <path
            d={`M${String(x - r)} ${String(y - 1)}a${String(r)} ${String(r * 0.8)} 0 0 1 ${String(r * 1.4)} ${String(-r * 0.7)}M${String(x + r)} ${String(y + 1)}a${String(r)} ${String(r * 0.8)} 0 0 1 ${String(-r * 1.3)} ${String(r * 0.7)}`}
            fill="none"
            stroke="#2b1a14"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
    <g id="hero-decor-marble" fill="none" strokeLinecap="round">
      <path
        d="M-24-50C-10-40-18-20-4-10S14 6 4 22S-10 40 2 56"
        stroke="#80525b"
        strokeOpacity="0.55"
        strokeWidth="1.1"
      />
      <path
        d="M10-62C22-44 6-34 16-18S0 10 14 30"
        stroke="#cf8e80"
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      <path
        d="M-20 14C-10 24-18 36-6 50"
        stroke="#e9c46a"
        strokeOpacity="0.6"
        strokeWidth="0.7"
      />
    </g>
    <g id="hero-decor-stripes" fill="none" stroke="#cf8e80" strokeWidth="4">
      {[-64, -48, -32, -16, 0, 16, 32, 48, 64].map((y) => (
        <path key={y} d={`M-36 ${String(y)}L36 ${String(y - 36)}`} />
      ))}
    </g>
    <HalloweenDecor id="halloween" drip="#1c1118" bat="#1c1118" />
    <HalloweenDecor id="halloween-night" drip="#9be15d" bat="#1c1118" />
    <g id="hero-decor-festive" stroke="none">
      <path
        d="M-30-80H30V-30C18-34 8-46 0-50C-8-46-18-34-30-30Z"
        fill="#a3122c"
      />
      <path
        d="M-30-30C-18-34-8-46 0-50C8-46 18-34 30-30"
        fill="none"
        stroke="#e9c46a"
        strokeWidth="1.6"
      />
      <circle cx="-9" cy="2" r="2.4" fill="#e9c46a" />
      <circle cx="8" cy="20" r="2.4" fill="#e9c46a" />
      <circle cx="-6" cy="40" r="2.4" fill="#e9c46a" />
      <circle cx="12" cy="-12" r="1.8" fill="#fbf5f3" />
    </g>
  </>
);

export { FINISHES, FinishSwatch, HeroFinishDefs, isGradient };

export type { Finish };
