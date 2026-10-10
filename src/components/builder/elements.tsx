import type { ReactNode } from "react";
import type { ElementKind, NailElement } from "@/components/builder/state";
import { sparklePath } from "@/components/nail-art";
import { batPath, heartPath } from "@/components/nail-finishes";

// The things a nail can wear: patterns that cover the nail, illustrations
// that sit on it, and rhinestones. Everything is drawn in nail-local units
// (the nail is 48 wide, cuticle at y 52, the tip up towards negative y) with
// literal colours, so the live markup can be serialised for the download.

const PEARL = "#fbf5f3";
const ROSE = "#cf8e80";
const CHERRY = "#a3122c";
const INK = "#1c1118";
const GOLD = "#e9c46a";
const WHITE = "#ffffff";

interface ElementDefinition {
  kind: ElementKind;
  variant: string;
  // Extent at scale 1, for the selection box.
  width: number;
  height: number;
  // Default colours; patterns with a second colour are two-tone.
  color: string;
  color2?: string;
  // Patterns with a setting (tip depth, moon height, angle) start here.
  offset?: number;
}

const pattern = (
  variant: string,
  color: string,
  extra: Partial<Pick<ElementDefinition, "color2" | "offset">> = {},
): ElementDefinition => ({
  kind: "pattern",
  variant,
  width: 60,
  height: 200,
  color,
  ...extra,
});

const illustration = (
  variant: string,
  width: number,
  height: number,
  color: string,
  color2?: string,
): ElementDefinition => ({
  kind: "illustration",
  variant,
  width,
  height,
  color,
  ...(color2 === undefined ? {} : { color2 }),
});

const stone = (
  variant: string,
  width: number,
  height: number,
): ElementDefinition => ({
  kind: "stone",
  variant,
  width,
  height,
  color: "crystal",
});

const ELEMENTS: Readonly<Record<ElementKind, readonly ElementDefinition[]>> = {
  pattern: [
    pattern("french", PEARL, { offset: 0.4 }),
    pattern("half-moon", PEARL, { offset: 0.4 }),
    pattern("ombre", PEARL, { color2: ROSE, offset: 0.5 }),
    pattern("diagonal", PEARL, { offset: 0.5 }),
    pattern("chevron", PEARL, { offset: 0.4 }),
    pattern("stripes", PEARL, { offset: 0.75 }),
    pattern("polka", "#4a0d1c"),
    pattern("glitter", WHITE),
    pattern("marble", "#80525b", { color2: GOLD }),
    pattern("leopard", "#b8743f", { color2: "#2b1a14" }),
    pattern("snow", WHITE),
    pattern("stars", WHITE),
    pattern("hearts", CHERRY),
    pattern("foil", GOLD),
  ],
  illustration: [
    illustration("heart", 16, 14, CHERRY),
    illustration("star", 16, 16, GOLD),
    illustration("sparkle", 16, 16, PEARL),
    illustration("daisy", 18, 18, PEARL, GOLD),
    illustration("moon", 14, 16, GOLD),
    illustration("butterfly", 18, 14, "#b9a3d6", INK),
    illustration("leaf", 10, 18, "#9db59a", "#2f6b2e"),
    illustration("cherry", 14, 16, CHERRY, "#2f6b2e"),
    illustration("bow", 18, 10, ROSE, "#4a0d1c"),
    illustration("smiley", 14, 14, GOLD, INK),
    illustration("lightning", 10, 18, GOLD),
    illustration("bat", 18, 12, INK),
    illustration("snowflake", 16, 16, WHITE),
    illustration("evil-eye", 14, 14, "#2a5bd7", INK),
  ],
  stone: [
    stone("round-xs", 5, 5),
    stone("round-s", 8, 8),
    stone("round-m", 11, 11),
    stone("round-l", 16, 16),
    stone("drop-m", 9, 14),
    stone("drop-l", 13, 20),
    stone("square-s", 8, 8),
    stone("square-m", 11, 11),
  ],
};

const definitionOf = (kind: ElementKind, variant: string) =>
  ELEMENTS[kind].find((definition) => definition.variant === variant);

// Rhinestone colours: the body's light and base shades and its rim.
interface StoneColor {
  light: string;
  base: string;
  dark: string;
}

const STONE_COLORS: Readonly<Record<string, StoneColor>> = {
  crystal: { light: "#ffffff", base: "#e4ecf4", dark: "#9fb3c4" },
  ab: { light: "#ffffff", base: "#d9c6ff", dark: "#7fc4c9" },
  rose: { light: "#ffe1e8", base: "#f4a6b8", dark: "#c6607c" },
  gold: { light: "#fff3c4", base: "#e9c46a", dark: "#a67c1f" },
  black: { light: "#6b6b78", base: "#2b2b35", dark: "#0c0c12" },
  emerald: { light: "#b8f0d2", base: "#2f9d6a", dark: "#14563a" },
};

const STONE_COLOR_KEYS: readonly string[] = Object.keys(STONE_COLORS);

// Shared gradients for the stones; one set per SVG that draws them.
const ElementDefs = ({ prefix }: Readonly<{ prefix: string }>) => (
  <>
    {Object.entries(STONE_COLORS).map(([key, { light, base, dark }]) => (
      <radialGradient
        key={key}
        id={`${prefix}-stone-${key}`}
        cx="0.35"
        cy="0.3"
        r="0.8"
      >
        <stop offset="0" stopColor={light} />
        <stop offset="0.55" stopColor={base} />
        <stop offset="1" stopColor={dark} />
      </radialGradient>
    ))}
  </>
);

// Deterministic scatter over the nail, so the server and client agree.
const fraction = (value: number) => value - Math.floor(value);
const scatter = (count: number, seed: number) =>
  Array.from({ length: count }, (_, index) => ({
    x: -22 + fraction((index + 1) * 0.754_878 + seed * 0.37) * 44,
    y: -118 + fraction((index + 1) * 0.569_84 + seed * 0.59) * 172,
    r: fraction((index + 1) * 0.414_214 + seed * 0.83),
  }));

const GLITTER = scatter(46, 1);
const STARS = scatter(22, 2);
const FOIL = scatter(14, 3);
const SNOW = scatter(12, 4);
const HEARTS = scatter(9, 5);

const LEOPARD_SPOTS = [-104, -72, -40, -8, 24].flatMap((y, row) =>
  (row % 2 ? [-12, 12] : [-14, 2, 15]).map((x, column) => ({
    x,
    y: y + (column % 2) * 9,
    r: 4.5 + ((row + column) % 3) * 0.8,
  })),
);

// Rows of dots, every other row shifted so they sit in a diamond grid.
const POLKA = [-112, -94, -76, -58, -40, -22, -4, 14, 32, 50].flatMap(
  (y, row) => (row % 2 ? [-15, 0, 15] : [-7.5, 7.5]).map((x) => ({ x, y })),
);

const n = (value: number) => value.toFixed(1);

interface PatternProperties {
  color: string;
  color2: string;
  offset: number;
  tipY: number;
  // Unique within the document, for the ombré gradient.
  id: string;
}

// Patterns are a function of the nail's length, so a french tip follows the
// free edge up as the nail grows.
const PATTERNS: Readonly<Record<string, (p: PatternProperties) => ReactNode>> =
  {
    french: ({ color, offset, tipY }) => {
      const y0 = tipY + 12 + offset * 36;

      return (
        <path
          d={`M-30-150H30V${n(y0)}C18 ${n(y0 - 2)} 8 ${n(y0 - 12)} 0 ${n(y0 - 14)}C-8 ${n(y0 - 12)}-18 ${n(y0 - 2)}-30 ${n(y0)}Z`}
          fill={color}
        />
      );
    },
    "half-moon": ({ color, offset }) => {
      const y0 = 52 - (6 + offset * 30);

      return (
        <path
          d={`M-30 80H30V${n(y0 + 12)}C18 ${n(y0 - 2)}-18 ${n(y0 - 2)}-30 ${n(y0 + 12)}Z`}
          fill={color}
        />
      );
    },
    ombre: ({ color, color2, offset, tipY, id }) => (
      <>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={n(tipY)}
          x2="0"
          y2="52"
        >
          <stop offset={n(Math.max(0, offset - 0.3))} stopColor={color} />
          <stop offset={n(Math.min(1, offset + 0.3))} stopColor={color2} />
        </linearGradient>
        <rect x="-30" y="-150" width="60" height="230" fill={`url(#${id})`} />
      </>
    ),
    diagonal: ({ color, offset, tipY }) => {
      const c = tipY + (52 - tipY) * offset;

      return (
        <path d={`M-30-150H30V${n(c - 16)}L-30 ${n(c + 16)}Z`} fill={color} />
      );
    },
    chevron: ({ color, offset, tipY }) => {
      const y0 = tipY + 14 + offset * 40;

      return (
        <path
          d={`M-30-150H30V${n(y0)}L0 ${n(y0 - 20)}L-30 ${n(y0)}Z`}
          fill={color}
        />
      );
    },
    stripes: ({ color, offset, tipY }) => (
      <g
        transform={`rotate(${n((offset - 0.5) * 120)} 0 ${n((tipY + 52) / 2)})`}
        stroke={color}
        strokeWidth="4"
        fill="none"
      >
        {Array.from({ length: 23 }, (_, index) => -132 + index * 12).map(
          (y) => (
            <path key={y} d={`M-80 ${String(y)}H80`} />
          ),
        )}
      </g>
    ),
    polka: ({ color }) => (
      <g fill={color}>
        {POLKA.map(({ x, y }) => (
          <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="3.2" />
        ))}
      </g>
    ),
    glitter: ({ color }) => (
      <g fill={color}>
        {GLITTER.map(({ x, y, r }, index) => (
          <circle
            key={index}
            cx={n(x)}
            cy={n(y)}
            r={n(0.6 + r * 1.4)}
            opacity={(0.4 + r * 0.6).toFixed(2)}
          />
        ))}
      </g>
    ),
    marble: ({ color, color2 }) => (
      <g fill="none" strokeLinecap="round">
        <path
          d="M-24-108C-10-96-18-76-4-64S14-46 4-30S-10-8 2 8S-12 30-2 56"
          stroke={color}
          strokeOpacity="0.6"
          strokeWidth="1.1"
        />
        <path
          d="M10-120C22-100 6-90 16-74S0-46 14-26S4 0 16 20S2 40 12 58"
          stroke={color}
          strokeOpacity="0.4"
          strokeWidth="0.8"
        />
        <path
          d="M-20-40C-10-30-18-18-6-4M-14 22C-6 30-12 42 0 54M-6-96C2-88-6-78 6-70"
          stroke={color2}
          strokeOpacity="0.7"
          strokeWidth="0.7"
        />
      </g>
    ),
    leopard: ({ color, color2 }) => (
      <g>
        {LEOPARD_SPOTS.map(({ x, y, r }) => (
          <g key={`${String(x)}-${String(y)}`}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={color} />
            <path
              d={`M${n(x - r)} ${n(y - 1)}a${n(r)} ${n(r * 0.8)} 0 0 1 ${n(r * 1.4)} ${n(-r * 0.7)}M${n(x + r)} ${n(y + 1)}a${n(r)} ${n(r * 0.8)} 0 0 1 ${n(-r * 1.3)} ${n(r * 0.7)}`}
              fill="none"
              stroke={color2}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    ),
    snow: ({ color }) => (
      <g fill={color}>
        {SNOW.map(({ x, y, r }, index) => (
          <path
            key={index}
            d={sparklePath(x, y, 3 + r * 3)}
            opacity={(0.8 + r * 0.2).toFixed(2)}
          />
        ))}
      </g>
    ),
    stars: ({ color }) => (
      <g fill={color}>
        {STARS.map(({ x, y, r }, index) =>
          r > 0.7 ?
            <path
              key={index}
              d={sparklePath(x, y, 2 + r * 3)}
              opacity={(0.7 + r * 0.3).toFixed(2)}
            />
          : <circle
              key={index}
              cx={n(x)}
              cy={n(y)}
              r={n(0.5 + r)}
              opacity={(0.5 + r * 0.5).toFixed(2)}
            />,
        )}
      </g>
    ),
    hearts: ({ color }) => (
      <g fill={color}>
        {HEARTS.map(({ x, y, r }, index) => (
          <path
            key={index}
            d={heartPath(x, y, 3 + r * 2.5)}
            opacity={(0.75 + r * 0.25).toFixed(2)}
          />
        ))}
      </g>
    ),
    foil: ({ color }) => (
      <g fill={color}>
        {FOIL.map(({ x, y, r }, index) => (
          <path
            key={index}
            d={`M${n(x)} ${n(y)}l${n(3 + r * 4)} ${n(1 - r * 3)}l${n(-1 - r * 2)} ${n(3 + r * 3)}l${n(-3 - r * 2)} ${n(-0.5 + r)}z`}
            opacity={(0.75 + r * 0.25).toFixed(2)}
          />
        ))}
      </g>
    ),
  };

// Pattern settings that have a slider: which, and what the slider is for.
type PatternSetting = "depth" | "height" | "blend" | "position" | "angle";

const PATTERN_SETTINGS: Readonly<Record<string, PatternSetting>> = {
  french: "depth",
  "half-moon": "height",
  ombre: "blend",
  diagonal: "position",
  chevron: "depth",
  stripes: "angle",
};

const TWO_TONE = new Set(["ombre", "marble", "leopard"]);

// A regular star, point up, centred on the origin.
const starPath = (outer: number, inner: number, points = 5) => {
  const vertices = Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 ? inner : outer;
    const angle = (index * Math.PI) / points - Math.PI / 2;

    return `${n(Math.cos(angle) * radius)} ${n(Math.sin(angle) * radius)}`;
  });

  return `M${vertices.join("L")}Z`;
};

const STAR = starPath(8, 3.4);
const HEART = heartPath(0, -1, 5);
const SPARKLE = sparklePath(0, 0, 8);
const BAT = batPath(0, 0, 0.45);

// Illustrations in the site's line style: a fill with a faint outline, about
// 16 units across so scale 1 looks right on a nail.
const ILLUSTRATIONS: Readonly<
  Record<string, (color: string, color2: string) => ReactNode>
> = {
  heart: (color) => <path d={HEART} fill={color} />,
  star: (color) => <path d={STAR} fill={color} strokeLinejoin="round" />,
  sparkle: (color) => <path d={SPARKLE} fill={color} />,
  daisy: (color, color2) => (
    <g>
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-5.5"
          rx="2.6"
          ry="4.2"
          fill={color}
          transform={`rotate(${String(angle)})`}
        />
      ))}
      <circle r="2.6" fill={color2} />
    </g>
  ),
  moon: (color) => (
    <path d="M3-7.4A8 8 0 1 0 3 7.4A7.67 7.67 0 0 1 3-7.4Z" fill={color} />
  ),
  butterfly: (color, color2) => (
    <g>
      <path
        d="M-1-1C-4-8-10-8-9-3C-10 1-6 4-1 2ZM1-1C4-8 10-8 9-3C10 1 6 4 1 2Z"
        fill={color}
      />
      <path
        d="M-1 2C-6 4-7 8-3 7C-1 6 0 4-1 2ZM1 2C6 4 7 8 3 7C1 6 0 4 1 2Z"
        fill={color}
        opacity="0.8"
      />
      <path
        d="M0-3V5M0-3L-2-7M0-3L2-7"
        stroke={color2}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  leaf: (color, color2) => (
    <g>
      <path d="M0-9C6-5 6 4 0 9C-6 4-6-5 0-9Z" fill={color} />
      <path
        d="M0-7V8M0-1L-3-4M0 2L3-1"
        stroke={color2}
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  cherry: (color, color2) => (
    <g>
      <path
        d="M-3 2C-1-4 2-7 5-8M4 2C3-3 4-6 5-8"
        stroke={color2}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M5-8C3-9 1-8 0-6C2-6 4-6 5-8Z" fill={color2} />
      <circle cx="-3.5" cy="4" r="3.6" fill={color} />
      <circle cx="4" cy="4.5" r="3.4" fill={color} />
      <circle cx="-4.5" cy="2.8" r="0.9" fill={WHITE} opacity="0.7" />
      <circle cx="3" cy="3.3" r="0.8" fill={WHITE} opacity="0.7" />
    </g>
  ),
  bow: (color, color2) => (
    <g>
      <path
        d="M0 0C-3-5-9-6-9-2C-9 2-3 4 0 0ZM0 0C3-5 9-6 9-2C9 2 3 4 0 0Z"
        fill={color}
      />
      <path d="M0 0L-4 5L-2 5ZM0 0L4 5L2 5Z" fill={color} opacity="0.85" />
      <circle r="1.8" fill={color2} />
    </g>
  ),
  smiley: (color, color2) => (
    <g>
      <circle r="7" fill={color} />
      <circle cx="-2.5" cy="-1.5" r="0.9" fill={color2} />
      <circle cx="2.5" cy="-1.5" r="0.9" fill={color2} />
      <path
        d="M-3.5 2C-2 4.5 2 4.5 3.5 2"
        stroke={color2}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  lightning: (color) => (
    <path d="M2-9L-5 1H-1L-2 9L5-2H1Z" fill={color} strokeLinejoin="round" />
  ),
  bat: (color) => <path d={BAT} fill={color} />,
  snowflake: (color) => (
    <g stroke={color} strokeWidth="1" fill="none" strokeLinecap="round">
      {[0, 60, 120].map((angle) => (
        <path
          key={angle}
          d="M0-8V8M0-5L-2-7M0-5L2-7M0 5L-2 7M0 5L2 7"
          transform={`rotate(${String(angle)})`}
        />
      ))}
    </g>
  ),
  "evil-eye": (color, color2) => (
    <g>
      <circle r="7" fill={color} />
      <circle r="4.6" fill={WHITE} />
      <circle r="3" fill="#7fc4ff" />
      <circle r="1.5" fill={color2} />
    </g>
  ),
};

const DROP = "M0-7C3-4 4.5-1.5 4.5 1.2A4.5 4.5 0 0 1-4.5 1.2C-4.5-1.5-3-4 0-7Z";

// A faceted disc: the gradient body, a darker rim and two highlight slivers.
const Stone = ({
  variant,
  color,
  prefix,
}: Readonly<{ variant: string; color: string; prefix: string }>) => {
  const palette = STONE_COLORS[color] ?? STONE_COLORS.crystal;
  const fill = `url(#${prefix}-stone-${palette ? color : "crystal"})`;
  const rim = palette?.dark ?? "#9fb3c4";
  const definition = definitionOf("stone", variant);
  const size = definition?.width ?? 8;
  const shape =
    variant.startsWith("drop") ?
      <path
        d={DROP}
        transform={`scale(${n(size / 9)})`}
        fill={fill}
        stroke={rim}
        strokeWidth={n(0.6 / (size / 9))}
      />
    : variant.startsWith("square") ?
      <rect
        x={n(-size / 2)}
        y={n(-size / 2)}
        width={n(size)}
        height={n(size)}
        rx={n(size * 0.12)}
        fill={fill}
        stroke={rim}
        strokeWidth="0.6"
      />
    : <circle r={n(size / 2)} fill={fill} stroke={rim} strokeWidth="0.6" />;
  const k = size / 10;

  return (
    <g>
      {shape}
      <path
        d={`M${n(-2.6 * k)} ${n(-1.6 * k)}Q${n(-1.2 * k)} ${n(-3.2 * k)} ${n(1.2 * k)} ${n(-2.6 * k)}`}
        stroke={WHITE}
        strokeWidth={n(0.9 * k)}
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d={`M${n(1.8 * k)} ${n(1.6 * k)}Q${n(2.6 * k)} ${n(0.8 * k)} ${n(2.4 * k)} ${n(-0.4 * k)}`}
        stroke={WHITE}
        strokeWidth={n(0.6 * k)}
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </g>
  );
};

const elementTransform = (element: NailElement) =>
  `translate(${n(element.x)} ${n(element.y)}) rotate(${n(element.rotation)}) scale(${n(element.scale * (element.flip ? -1 : 1))} ${n(element.scale)})`;

// One placed element, in nail-local coordinates.
// `prefix` is unique to the SVG (for the element's own gradient); `defs`
// names the SVG whose defs hold the stone gradients, shared where possible.
const ElementView = ({
  element,
  tipY,
  prefix,
  defs = prefix,
}: Readonly<{
  element: NailElement;
  tipY: number;
  prefix: string;
  defs?: string;
}>) => {
  const definition = definitionOf(element.kind, element.variant);
  const color2 = element.color2 ?? definition?.color2 ?? INK;

  switch (element.kind) {
    case "pattern": {
      const draw = PATTERNS[element.variant];

      return draw ?
          <g transform={element.flip ? "scale(-1 1)" : undefined}>
            {draw({
              color: element.color,
              color2,
              offset: element.offset ?? definition?.offset ?? 0.5,
              tipY,
              id: `${prefix}-el-${element.id}`,
            })}
          </g>
        : undefined;
    }
    case "illustration": {
      const draw = ILLUSTRATIONS[element.variant];

      return draw ?
          <g transform={elementTransform(element)}>
            <g className="element-pop">{draw(element.color, color2)}</g>
          </g>
        : undefined;
    }
    case "stone": {
      return (
        <g transform={elementTransform(element)}>
          <g className="element-pop">
            <Stone
              variant={element.variant}
              color={element.color}
              prefix={defs}
            />
          </g>
        </g>
      );
    }
  }
};

export {
  definitionOf,
  ElementDefs,
  ELEMENTS,
  ElementView,
  PATTERN_SETTINGS,
  STONE_COLOR_KEYS,
  STONE_COLORS,
  TWO_TONE,
};

export type { ElementDefinition, PatternSetting };
