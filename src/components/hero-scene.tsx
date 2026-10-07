"use client";

import {
  ChromeGradient,
  CUTICLE,
  delay,
  GLOSS,
  NAIL,
  sparklePath,
} from "@/components/nail-art";

// A manicure on a loop: the brush (which doubles as the bottle cap) lifts
// out, paints each nail from cuticle to tip, returns to the bottle and the
// next round brings the next shade. Server-rendered as bare nails with the
// bottle capped; the loop is driven by the Web Animations API once mounted.

interface Finger {
  order: number;
  angle: number;
  lift: number;
  scale: number;
}

// Listed in paint order (outer fingers first, so inner ones overlap them);
// `order` is the left-to-right position the brush follows.
const FINGERS: Finger[] = [
  { order: 0, angle: -30, lift: 265, scale: 0.78 },
  { order: 4, angle: 30, lift: 275, scale: 0.74 },
  { order: 1, angle: -14, lift: 225, scale: 0.92 },
  { order: 3, angle: 14, lift: 232, scale: 0.9 },
  { order: 2, angle: 0, lift: 205, scale: 1 },
];

const LEFT_TO_RIGHT = [...FINGERS].sort(
  (first, second) => first.order - second.order,
);

const SHADES = [
  "var(--color-rose)",
  "url(#hero-chrome)",
  "var(--color-rose-soft)",
  "var(--color-plum)",
  "var(--color-pearl)",
];

const FIRST_SHADE = "var(--color-rose)";

// Gradients cannot transition, so the bottle fades a layer in for them.
const isGradient = (shade: string) => shade.startsWith("url(");

// Fresh polish is uncovered from the cuticle up rather than scaled, so a
// gradient keeps its angle while it is painted on.
const COVERED = "inset(100% 0 0 0)";
const UNCOVERED = "inset(0 0 0 0)";

const FINGER = "M-38 520V8C-38-18-22-30 0-30C22-30 38-18 38 8V520";
const ARCH = "M0 200A200 200 0 0 1 400 200V460Q400 500 360 500H40Q0 500 0 460Z";
const ARCH_INNER =
  "M12 200A188 188 0 0 1 388 200V458Q388 488 358 488H42Q12 488 12 458Z";

// The hand is drawn in the old 400×440 space and shifted into the arch.
const HAND_OFFSET = 60;
const PIVOT = { x: 200, y: 560 };

const SPARKLES = [
  { x: 70, y: 180, size: 11 },
  { x: 330, y: 152, size: 15 },
  { x: 52, y: 320, size: 7 },
];

const pose = (x: number, y: number, angle: number) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(0.9)`;

const BRUSH_IN_BOTTLE = pose(425, 490, 0);
const BRUSH_ABOVE_BOTTLE = pose(425, 382, -12);

// Canvas position of a point on a nail's centre line (nail-local y).
const nailPoint = (finger: Finger, y: number) => {
  const radians = (finger.angle * Math.PI) / 180;
  const fromPivot = finger.lift + finger.scale * y - PIVOT.y;

  return {
    x: PIVOT.x - fromPivot * Math.sin(radians),
    y: PIVOT.y + fromPivot * Math.cos(radians) + HAND_OFFSET,
  };
};

const sleep = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });

const animateTo = async (
  element: SVGElement,
  keyframes: Keyframe[],
  duration: number,
  easing = "cubic-bezier(0.65, 0, 0.35, 1)",
) => {
  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill: "forwards",
  });

  await animation.finished;
  animation.commitStyles();
  animation.cancel();
};

interface NailParts {
  finger: Finger;
  base: SVGElement;
  fresh: SVGElement;
  gloss: SVGElement;
}

interface SceneParts {
  brush: SVGElement;
  bristles: SVGElement;
  liquid: SVGElement;
  liquidGradient: SVGElement;
  pop: SVGElement;
  nails: NailParts[];
}

const findParts = (svg: SVGSVGElement): SceneParts | undefined => {
  const pick = (root: Element, selector: string) =>
    root.querySelector<SVGElement>(selector) ?? undefined;
  const nails = LEFT_TO_RIGHT.map((finger) => {
    const group = svg.querySelector(`[data-nail="${String(finger.order)}"]`);
    const base = group && pick(group, "[data-base]");
    const fresh = group && pick(group, "[data-fresh]");
    const gloss = group && pick(group, "[data-gloss]");

    return base && fresh && gloss ? { finger, base, fresh, gloss } : undefined;
  }).filter((nail) => nail !== undefined);
  const brush = pick(svg, "[data-brush]");
  const bristles = pick(svg, "[data-bristles]");
  const liquid = pick(svg, "[data-liquid]");
  const liquidGradient = pick(svg, "[data-liquid-gradient]");
  const pop = pick(svg, "[data-pop]");

  return (
      brush &&
        bristles &&
        liquid &&
        liquidGradient &&
        pop &&
        nails.length === FINGERS.length
    ) ?
      { brush, bristles, liquid, liquidGradient, pop, nails }
    : undefined;
};

const paintNail = async (
  { brush, pop }: SceneParts,
  { finger, base, fresh, gloss }: NailParts,
  shade: string,
  approach: number,
) => {
  const start = nailPoint(finger, 50);
  const end = nailPoint(finger, -64);
  const tip = nailPoint(finger, -78);
  const angle = finger.angle + 24;
  const stroke = 640;

  await animateTo(
    brush,
    [{ transform: pose(start.x, start.y, angle) }],
    approach,
  );
  fresh.style.fill = shade;
  await Promise.all([
    animateTo(brush, [{ transform: pose(end.x, end.y, angle) }], stroke),
    animateTo(fresh, [{ clipPath: COVERED }, { clipPath: UNCOVERED }], stroke),
  ]);
  base.style.fill = shade;
  fresh.style.clipPath = COVERED;

  // Fire-and-forget flourishes: a glint on the fresh polish and a sparkle.
  gloss.animate([{ opacity: 1, offset: 0.4 }, { opacity: 0.75 }], {
    duration: 700,
    fill: "forwards",
  });
  const at = `translate(${tip.x.toFixed(1)}px, ${tip.y.toFixed(1)}px)`;
  pop.animate(
    [
      { opacity: 0, transform: `${at} scale(0) rotate(0deg)` },
      { opacity: 1, transform: `${at} scale(1) rotate(90deg)`, offset: 0.4 },
      { opacity: 0, transform: `${at} scale(0) rotate(180deg)` },
    ],
    { duration: 800, easing: "ease-out" },
  );
};

const paintRound = async (
  parts: SceneParts,
  shade: string,
  nextShade: string,
  signal: AbortSignal,
) => {
  parts.bristles.style.fill = shade;
  await animateTo(parts.brush, [{ transform: BRUSH_ABOVE_BOTTLE }], 500);
  for (const [index, nail] of parts.nails.entries()) {
    await paintNail(parts, nail, shade, index === 0 ? 650 : 380);
  }
  await animateTo(parts.brush, [{ transform: BRUSH_ABOVE_BOTTLE }], 700);
  await animateTo(
    parts.brush,
    [{ transform: BRUSH_IN_BOTTLE }],
    420,
    "ease-in",
  );
  if (isGradient(nextShade)) {
    parts.liquidGradient.style.opacity = "1";
  } else {
    parts.liquid.style.fill = nextShade;
    parts.liquidGradient.style.opacity = "0";
  }
  await sleep(1900, signal);
};

const runLoop = async (parts: SceneParts, signal: AbortSignal) => {
  // Wait for the intro curtain (first visit) and the fingers drawing in.
  const introSeen = document.documentElement.dataset.intro === "seen";

  await sleep(introSeen ? 1500 : 3700, signal);
  const state = { round: 0 };

  while (!signal.aborted) {
    const shade = SHADES[state.round % SHADES.length] ?? FIRST_SHADE;
    const nextShade = SHADES[(state.round + 1) % SHADES.length] ?? FIRST_SHADE;

    await paintRound(parts, shade, nextShade, signal);
    state.round += 1;
  }
};

// Ref callback with cleanup (React 19): starts the loop on mount, stops it on
// unmount. Reduced-motion visitors get the nails painted, without the loop.
const startScene = (svg: SVGSVGElement | null) => {
  const parts = svg ? findParts(svg) : undefined;

  if (!svg || !parts) return;

  if (globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const nail of parts.nails) {
      nail.base.style.fill = FIRST_SHADE;
      nail.gloss.style.opacity = "0.75";
    }
    return;
  }

  const controller = new AbortController();

  runLoop(parts, controller.signal).catch(() => undefined);

  return () => {
    controller.abort();
    for (const animation of svg.getAnimations({ subtree: true })) {
      animation.cancel();
    }
  };
};

const HeroScene = ({ className }: Readonly<{ className?: string }>) => (
  <svg
    ref={startScene}
    viewBox="0 0 470 500"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <clipPath id="hero-arch-clip">
        <path d={ARCH} />
      </clipPath>
      <clipPath id="hero-nail-clip">
        <path d={NAIL} />
      </clipPath>
      <radialGradient
        id="hero-glow"
        cx="200"
        cy="330"
        r="190"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#cf8e80" stopOpacity="0.28" />
        <stop offset="1" stopColor="#cf8e80" stopOpacity="0" />
      </radialGradient>
      <ChromeGradient id="hero-chrome" />
    </defs>

    <path
      d={ARCH}
      className="fill-burgundy-deep/60 stroke-rose/25"
      strokeWidth="1.5"
    />
    <path d={ARCH_INNER} className="stroke-rose/15" strokeWidth="1" />

    <g clipPath="url(#hero-arch-clip)">
      <rect width="400" height="500" fill="url(#hero-glow)" stroke="none" />
      <g transform={`translate(0 ${String(HAND_OFFSET)})`}>
        {FINGERS.map((finger) => (
          <g
            key={finger.order}
            data-nail={finger.order}
            transform={`rotate(${String(finger.angle)} ${String(PIVOT.x)} ${String(PIVOT.y)}) translate(200 ${String(finger.lift)}) scale(${String(finger.scale)})`}
          >
            <path
              d={FINGER}
              pathLength={1}
              strokeWidth="1.3"
              className="nail-draw fill-burgundy"
              style={delay(finger.order * 0.08)}
            />
            <g clipPath="url(#hero-nail-clip)" stroke="none">
              <rect
                data-base
                x="-30"
                y="-75"
                width="60"
                height="140"
                className="fill-pearl/15"
              />
              <rect
                data-fresh
                x="-30"
                y="-75"
                width="60"
                height="140"
                style={{ clipPath: COVERED }}
              />
            </g>
            <path
              d={NAIL}
              pathLength={1}
              strokeWidth="1.6"
              className="nail-draw"
              style={delay(0.2 + finger.order * 0.1)}
            />
            <path d={CUTICLE} strokeWidth="1" opacity="0.6" />
            <path
              data-gloss
              d={GLOSS}
              strokeWidth="2.4"
              className="stroke-white"
              style={{ opacity: 0.15 }}
            />
          </g>
        ))}
      </g>
    </g>

    {SPARKLES.map(({ x, y, size }, index) => (
      <path
        key={`${String(x)}-${String(y)}`}
        d={sparklePath(x, y, size)}
        stroke="none"
        className="sparkle fill-rose-soft"
        style={delay(1.2 + index * 0.15)}
      />
    ))}
    <path
      data-pop
      d={sparklePath(0, 0, 10)}
      stroke="none"
      className="fill-rose-soft"
      style={{ opacity: 0 }}
    />

    {/* The brush: bristles tip at the origin, handle (the bottle cap) above. */}
    <g data-brush style={{ transform: BRUSH_IN_BOTTLE }}>
      <path
        data-bristles
        d="M-5.5-26C-5.5-12-3-3 0 0C3-3 5.5-12 5.5-26Z"
        stroke="none"
        style={{ fill: FIRST_SHADE }}
      />
      <rect
        x="-2"
        y="-58"
        width="4"
        height="33"
        stroke="none"
        className="fill-rose-soft"
      />
      <rect
        x="-10"
        y="-112"
        width="20"
        height="56"
        rx="4"
        strokeWidth="1.5"
        className="fill-burgundy-deep"
      />
      <path d="M-5-104V-66" strokeWidth="2" className="stroke-white/35" />
    </g>

    {/* The bottle, drawn over the brush so it hides the bristles when capped. */}
    <g className="rise" style={delay(0.9)}>
      <rect
        x="416"
        y="424"
        width="18"
        height="18"
        rx="3"
        strokeWidth="1.5"
        className="fill-rose-soft/20"
      />
      <rect
        data-liquid
        x="395"
        y="440"
        width="60"
        height="58"
        rx="13"
        strokeWidth="1.5"
        style={{ fill: FIRST_SHADE, transition: "fill 0.8s ease" }}
      />
      <rect
        data-liquid-gradient
        x="395"
        y="440"
        width="60"
        height="58"
        rx="13"
        strokeWidth="1.5"
        fill="url(#hero-chrome)"
        style={{ opacity: 0, transition: "opacity 0.8s ease" }}
      />
      <path d="M405 452V484" strokeWidth="3" className="stroke-white/45" />
      <path
        d={sparklePath(428, 469, 6)}
        stroke="none"
        className="fill-white/70"
      />
    </g>
  </svg>
);

export default HeroScene;
