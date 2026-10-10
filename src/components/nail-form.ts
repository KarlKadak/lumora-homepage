// The nail's outline for a chosen length, shape and sharpness, in the nail
// drawings' own space: x from -24 to 24, the cuticle at y 52, the tip
// towards negative y. Pure geometry, no DOM.

type Level = 1 | 2 | 3 | 4 | 5;

interface NailForm {
  length: Level;
  shape: Level;
  sharpness: Level;
}

type Point = readonly [number, number];
type Cubic = readonly [Point, Point, Point, Point];

const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

// A medium-length, softly rounded almond.
const DEFAULT_FORM: NailForm = { length: 3, shape: 2, sharpness: 5 };

const HALF_WIDTH = 24;
const CUTICLE_Y = 52;
const BED_TOP = -6;
// Corner radius at full sharpness, before clamping to the adjoining edges.
const TIP_RADIUS = 22;
// How far a side may bow outwards for the pointiest shape.
const BOW = 6;
// Handle length for a circular corner, as a share of the radius.
const KAPPA = 0.5523;
const SAMPLES = 32;

const tipY = (length: Level) => -(30 + 20 * (length - 1));

const format = (value: number) =>
  (Math.abs(value) < 0.05 ? 0 : value).toFixed(1);
const pointString = ([x, y]: Point) => `${format(x)} ${format(y)}`;
const cubicString = ([, c1, c2, end]: Cubic) =>
  `C${pointString(c1)} ${pointString(c2)} ${pointString(end)}`;

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const cubicAt = ([p0, p1, p2, p3]: Cubic, t: number): Point => {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);

  return lerp(lerp(a, b, t), lerp(b, c, t), t);
};

// Unit tangent in the direction of travel.
const cubicTangent = ([p0, p1, p2, p3]: Cubic, t: number): Point => {
  const u = 1 - t;
  const x =
    3 * u * u * (p1[0] - p0[0]) +
    6 * u * t * (p2[0] - p1[0]) +
    3 * t * t * (p3[0] - p2[0]);
  const y =
    3 * u * u * (p1[1] - p0[1]) +
    6 * u * t * (p2[1] - p1[1]) +
    3 * t * t * (p3[1] - p2[1]);
  const length = Math.hypot(x, y) || 1;

  return [x / length, y / length];
};

// De Casteljau: the two halves of the curve either side of `t`.
const splitCubic = ([p0, p1, p2, p3]: Cubic, t: number): [Cubic, Cubic] => {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const f = lerp(b, c, t);
  const middle = lerp(d, f, t);

  return [
    [p0, a, d, middle],
    [middle, f, c, p3],
  ];
};

// Arc length from the start up to each sample.
const arcLengths = (cubic: Cubic) =>
  Array.from({ length: SAMPLES + 1 }, (_, step) =>
    cubicAt(cubic, step / SAMPLES),
  ).reduce<readonly number[]>((lengths, point, step, points) => {
    const previous = points[step - 1];
    const last = lengths.at(-1) ?? 0;

    return [
      ...lengths,
      previous ?
        last + Math.hypot(point[0] - previous[0], point[1] - previous[1])
      : 0,
    ];
  }, []);

// The parameter at which the curve has covered `distance` from its start.
const parameterAt = (lengths: readonly number[], distance: number) => {
  const step = lengths.findIndex((length) => length >= distance);

  if (step <= 0) return 0;
  const before = lengths[step - 1] ?? 0;
  const after = lengths[step] ?? before;
  const within = after > before ? (distance - before) / (after - before) : 0;

  return (step - 1 + within) / SAMPLES;
};

// The left side of the nail, from the top of the bed up to the tip corner,
// bowing outwards for pointed shapes; the right side is its mirror.
const leftSide = (h: number, yTip: number, bow: number): Cubic => {
  const start: Point = [-HALF_WIDTH, BED_TOP];
  const end: Point = [-h, yTip];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  // Outward is away from the nail's centre line, to the left here.
  const normal: Point = [
    -Math.abs(dy) / length,
    -(dx / length) * Math.sign(dy),
  ];
  const bowed = (t: number): Point => [
    start[0] + dx * t + normal[0] * bow,
    start[1] + dy * t + normal[1] * bow,
  ];

  return [start, bowed(1 / 3), bowed(2 / 3), end];
};

const mirror = ([x, y]: Point): Point => [-x, y];
const mirrorCubic = ([p0, p1, p2, p3]: Cubic): Cubic => [
  mirror(p3),
  mirror(p2),
  mirror(p1),
  mirror(p0),
];

// Nail outline as an absolute M/L/C/Z path, which `placePath` understands.
const nailOutline = (form: NailForm): string => {
  const f = (form.shape - 1) / 4;
  const k = (form.sharpness - 1) / 4;
  const yTip = tipY(form.length);
  const h = HALF_WIDTH * f;
  const left = leftSide(h, yTip, BOW * (1 - f));
  const right = mirrorCubic(left);
  const lengths = arcLengths(left);
  const sideLength = lengths.at(-1) ?? 0;
  const r = k * Math.min(TIP_RADIUS, sideLength * 0.9, h > 0 ? h : Infinity);
  const bed = `M${pointString([-HALF_WIDTH, CUTICLE_Y])}L${pointString([-HALF_WIDTH, BED_TOP])}`;
  const cuticle = `L${pointString([HALF_WIDTH, CUTICLE_Y])}C${pointString([HALF_WIDTH, 64])} ${pointString([-HALF_WIDTH, 64])} ${pointString([-HALF_WIDTH, CUTICLE_Y])}Z`;

  if (r < 0.05) {
    const tip = h > 0 ? `L${pointString([h, yTip])}` : "";

    return `${bed}${cubicString(left)}${tip}${cubicString(right)}${cuticle}`;
  }

  // Trim both sides by r from the tip.
  const tLeft = parameterAt(lengths, sideLength - r);
  const [leftKept] = splitCubic(left, tLeft);
  const [, rightKept] = splitCubic(right, 1 - tLeft);
  const p0 = leftKept[3];
  const p1 = rightKept[0];
  const [ux, uy] = cubicTangent(left, tLeft);

  if (h === 0) {
    // The corners coincide: one dome through the apex with level tangent.
    const reach = ((yTip - p0[1]) * 8) / (6 * uy);
    const c1: Point = [p0[0] + ux * reach, p0[1] + uy * reach];
    const c2: Point = [p1[0] - ux * reach, p1[1] + uy * reach];

    return `${bed}${cubicString(leftKept)}${cubicString([p0, c1, c2, p1])}${cubicString(rightKept)}${cuticle}`;
  }

  // Two rounded corners with a flat free edge between them.
  const q0: Point = [-h + r, yTip];
  const q1: Point = [h - r, yTip];
  const handle = KAPPA * r;
  const leftCorner: Cubic = [
    p0,
    [p0[0] + ux * handle, p0[1] + uy * handle],
    [q0[0] - handle, yTip],
    q0,
  ];
  const [vx, vy] = cubicTangent(right, 1 - tLeft);
  const rightCorner: Cubic = [
    q1,
    [q1[0] + handle, yTip],
    [p1[0] - vx * handle, p1[1] - vy * handle],
    p1,
  ];

  return `${bed}${cubicString(leftKept)}${cubicString(leftCorner)}L${pointString(q1)}${cubicString(rightCorner)}${cubicString(rightKept)}${cuticle}`;
};

// Bounding box of the outline, for the editor's framing.
const nailBox = (form: NailForm) => ({
  x: -HALF_WIDTH,
  y: tipY(form.length),
  width: 2 * HALF_WIDTH,
  height: 64 - tipY(form.length),
});

type Preset =
  | "stiletto"
  | "softStiletto"
  | "almond"
  | "coffin"
  | "softCoffin"
  | "oval"
  | "square"
  | "squoval"
  | "round";

// Named forms the grid approximates, by shape row then sharpness column.
const PRESETS: readonly (readonly [Preset, Preset, Preset])[] = [
  ["stiletto", "softStiletto", "almond"],
  ["coffin", "softCoffin", "oval"],
  ["square", "squoval", "round"],
];

// Levels 1–2 take the first name, 3 the middle one, 4–5 the last.
const third = (level: Level) =>
  level <= 2 ? 0
  : level === 3 ? 1
  : 2;

const presetOf = ({
  shape,
  sharpness,
}: Pick<NailForm, "shape" | "sharpness">): Preset =>
  PRESETS[third(shape)]?.[third(sharpness)] ?? "almond";

export { DEFAULT_FORM, LEVELS, nailBox, nailOutline, presetOf, tipY };

export type { Level, NailForm, Preset };
