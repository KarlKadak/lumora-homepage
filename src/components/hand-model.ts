// A jointed 3D hand projected orthographically into an SVG frame: a wrist,
// a palm and five digits that each curl their own amount. Only outlines are
// drawn, so the builder reports each digit's outline, the silhouette that
// hides what is behind it, and an affine map for each nail. The hero's pose
// lives in hero-hand.ts and the builder's flat pose in builder-hand.ts; both
// are plain data handed to `buildHand`.
//
// Model units: the wrist crease to the middle knuckle is about 79. x runs
// towards the little finger, y towards the fingertips, z out of the back of
// the hand.

type Vec3 = readonly [number, number, number];
type Vec2 = readonly [number, number];

const DEG = Math.PI / 180;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, factor: number): Vec3 => [
  a[0] * factor,
  a[1] * factor,
  a[2] * factor,
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a: Vec3) => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));

// The part of `a` at right angles to the unit vector `along`.
const perpendicular = (a: Vec3, along: Vec3) =>
  normalize(add(a, scale(along, -dot(a, along))));

// Rotates `v` about the unit vector `axis` (Rodrigues' formula).
const rotate = (v: Vec3, axis: Vec3, degrees: number): Vec3 => {
  const sin = Math.sin(degrees * DEG);
  const cos = Math.cos(degrees * DEG);

  return add(
    add(scale(v, cos), scale(cross(axis, v), sin)),
    scale(axis, dot(axis, v) * (1 - cos)),
  );
};

// How far round the fingertip the nail wraps, in degrees either side of the
// back of the finger.
const NAIL_WRAP = 57;

interface Screen {
  x: number;
  y: number;
  // Towards the viewer.
  depth: number;
}

interface Digit {
  // Where the digit hangs off the hand: the knuckle, or the base of the thumb
  // down by the wrist.
  base: Vec3;
  // Which way the first bone points before the digit curls, and which way
  // its back (where the nail is) faces.
  heading: Vec3;
  dorsal: Vec3;
  // Bone lengths, how much the digit curls at the start of each bone, and
  // its half-width at every joint and the tip.
  bones: readonly number[];
  curl: readonly number[];
  radii: readonly number[];
  // How far along the digit each side's outline begins (screen left, then
  // right): sides facing another finger start at the web between them, the
  // outer sides run straight into the palm.
  starts: Vec2;
  // Where the shape that hides what is behind the digit begins.
  root: number;
  // How far round the fingertip the nail wraps, as a share of NAIL_WRAP;
  // the thumb's nail is narrower for its girth.
  nailWrap?: number;
}

type DigitName = "thumb" | "index" | "middle" | "ring" | "pinky";

const DIGIT_NAMES: readonly DigitName[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky",
];

// How the hand sits in the frame: turned about its own axis (yaw), seen from
// above (pitch), the whole arm rolled, the wrist bent back (extension), and
// where the wrist lands on screen at what scale.
interface HandView {
  yaw: number;
  pitch: number;
  roll: number;
  extension: number;
  scale: number;
  wrist: Vec2;
}

interface HandSpec {
  digits: Readonly<Record<DigitName, Digit>>;
  view: HandView;
  // A tighter framing to glide towards; `zoom` runs from 0 (view) to 1.
  closeUp?: { scale: number; wrist: Vec2 };
  // Three points up each side of the forearm, thumb side then little-finger
  // side, in model units before the wrist bends.
  forearm: readonly [readonly Vec3[], readonly Vec3[]];
  // Two points in the palm that the thumb web passes through on its way
  // from the thumb's knuckle to the index finger.
  web: readonly [Vec3, Vec3];
}

const OUT: Vec3 = [0, 0, 1];
const lean = (degrees: number): Vec3 => [
  Math.sin(degrees * DEG),
  Math.cos(degrees * DEG),
  0,
];

// Where a digit's outer side begins, well inside the palm so the outline runs
// smoothly out of the hand; and where the sides facing another finger begin.
const PALM = -20;
const WEB = 9;

// The thumb's outer side and the shape that hides what is behind it start
// a little below its base, so the thenar runs smoothly out of the wrist.
const THENAR = -8;

interface Bone {
  start: Vec3;
  direction: Vec3;
  dorsal: Vec3;
  // Distance along the digit where the bone begins.
  from: number;
  length: number;
}

interface Limb {
  digit: Digit;
  bones: readonly Bone[];
  last: Bone;
  length: number;
}

// Lays the bones out one after another, each curling about the hinge that is
// at right angles to both the bone and its back, so it bends towards the palm.
const limbOf = (digit: Digit): Limb => {
  const bones = digit.bones.reduce<readonly Bone[]>((done, length, index) => {
    const previous = done.at(-1);
    const heading = previous?.direction ?? normalize(digit.heading);
    const dorsal = previous?.dorsal ?? perpendicular(digit.dorsal, heading);
    const hinge = normalize(cross(dorsal, heading));
    const curl = digit.curl[index] ?? 0;

    return [
      ...done,
      {
        start:
          previous ?
            add(previous.start, scale(previous.direction, previous.length))
          : digit.base,
        direction: rotate(heading, hinge, curl),
        dorsal: rotate(dorsal, hinge, curl),
        from: previous ? previous.from + previous.length : 0,
        length,
      },
    ];
  }, []);
  const last = bones.at(-1) ?? {
    start: digit.base,
    direction: normalize(digit.heading),
    dorsal: OUT,
    from: 0,
    length: 1,
  };

  return { digit, bones, last, length: last.from + last.length };
};

const boneIndexAt = (limb: Limb, s: number) => {
  const index = limb.bones.findIndex((bone) => s < bone.from + bone.length);

  return index === -1 ? limb.bones.length - 1 : index;
};

const pointAt = (limb: Limb, s: number) => {
  const bone = limb.bones[boneIndexAt(limb, s)] ?? limb.last;

  return add(bone.start, scale(bone.direction, s - bone.from));
};

// Half-width of the digit, interpolated between the joints with a slight
// waist along each bone so the knuckles stand out.
const radiusAt = (limb: Limb, s: number) => {
  const index = boneIndexAt(limb, s);
  const bone = limb.bones[index] ?? limb.last;
  const u = Math.min(Math.max((s - bone.from) / bone.length, 0), 1);
  const from = limb.digit.radii[index] ?? 0;
  const to = limb.digit.radii[index + 1] ?? from;

  return (
    from + (to - from) * u - 0.08 * Math.min(from, to) * Math.sin(Math.PI * u)
  );
};

// Sampling along a digit, in model units, and how far either side of a point
// its tangent is averaged so the joints round off.
const STEP = 10;
const BLUR = 5;

const format = (value: number) => value.toFixed(1);

const pointString = ([x, y]: Vec2) => `${format(x)} ${format(y)}`;

// Uniform Catmull–Rom spline through the points, as cubic Béziers.
const smoothPath = (points: readonly Vec2[]) => {
  const at = (index: number) =>
    points[Math.min(Math.max(index, 0), points.length - 1)] ?? [0, 0];
  const segments = points.slice(1).map((_, index) => {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [
      at(index - 1),
      at(index),
      at(index + 1),
      at(index + 2),
    ];

    return `C${format(x1 + (x2 - x0) / 6)} ${format(y1 + (y2 - y0) / 6)} ${format(x2 - (x3 - x1) / 6)} ${format(y2 - (y3 - y1) / 6)} ${format(x2)} ${format(y2)}`;
  });

  return `M${pointString(at(0))}${segments.join("")}`;
};

const quadraticThrough = (start: Vec2, middle: Vec2, end: Vec2) => {
  const control: Vec2 = [
    2 * middle[0] - (start[0] + end[0]) / 2,
    2 * middle[1] - (start[1] + end[1]) / 2,
  ];

  return `M${pointString(start)}Q${pointString(control)} ${pointString(end)}`;
};

interface Layer {
  key: DigitName;
  outline: string;
  shape: string;
  details: string;
}

// A nail as an affine map from the nail drawings' own space (tip up at the
// origin, 48 wide, from y 52 at the cuticle to -70 at the tip) onto the
// screen: the nail lies on the back of the last bone and is foreshortened by
// the projection like the rest of the finger.
interface NailPose {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  // Screen angle of the nail's tip direction, clockwise from straight up.
  angle: number;
  // How squarely the nail faces the viewer, 1 being head on.
  facing: number;
}

interface Hand {
  layers: readonly Layer[];
  body: readonly string[];
  details: string;
  // Thumb to little finger: the order the brush paints them in.
  nails: readonly NailPose[];
}

// Projects the hand at the given yaw, glided `zoom` of the way towards the
// close-up. The hero turns slowly, so this runs every frame: everything in
// here is a function of the view.
const buildHand = (spec: HandSpec, yaw = spec.view.yaw, zoom = 0): Hand => {
  const { view, digits, forearm, web } = spec;
  const closeUp = spec.closeUp ?? { scale: view.scale, wrist: view.wrist };
  const mix = (from: number, to: number) => from + (to - from) * zoom;
  const scaleBy = mix(view.scale, closeUp.scale);
  const wrist = [
    mix(view.wrist[0], closeUp.wrist[0]),
    mix(view.wrist[1], closeUp.wrist[1]),
  ] as const;
  const thumb = limbOf(digits.thumb);
  const index = limbOf(digits.index);
  const middle = limbOf(digits.middle);
  const ring = limbOf(digits.ring);
  const pinky = limbOf(digits.pinky);

  // Orthographic projection into the frame. The forearm is projected without
  // the wrist extension, which only bends the hand.
  const project = (point: Vec3, hand = true): Screen => {
    const bent = hand ? rotate(point, [1, 0, 0], view.extension) : point;
    const [x, y, depth] = rotate(
      rotate(bent, [0, 1, 0], yaw),
      [1, 0, 0],
      view.pitch,
    );
    const sin = Math.sin(view.roll * DEG);
    const cos = Math.cos(view.roll * DEG);

    // Screen y runs down, then the arm is rolled clockwise.
    return {
      x: wrist[0] + scaleBy * (x * cos + y * sin),
      y: wrist[1] + scaleBy * (x * sin - y * cos),
      depth,
    };
  };

  // A hand-space vector projected without the translation.
  const direction = (v: Vec3): Screen => {
    const origin = project([0, 0, 0]);
    const tip = project(v);

    return {
      x: tip.x - origin.x,
      y: tip.y - origin.y,
      depth: tip.depth - origin.depth,
    };
  };

  const screenAt = (limb: Limb, s: number) => project(pointAt(limb, s));

  const tangentAt = (limb: Limb, s: number): Vec2 => {
    const before = screenAt(limb, Math.max(s - BLUR, PALM - BLUR));
    const after = screenAt(limb, Math.min(s + BLUR, limb.length));
    const length = Math.hypot(after.x - before.x, after.y - before.y);

    return [(after.x - before.x) / length, (after.y - before.y) / length];
  };

  // A point on the digit's outline: `side` is -1 for screen left, 1 for right.
  const edgePoint = (limb: Limb, side: 1 | -1, s: number): Vec2 => {
    const point = screenAt(limb, s);
    const [tx, ty] = tangentAt(limb, s);
    const r = radiusAt(limb, s) * scaleBy;

    return [point.x - side * ty * r, point.y + side * tx * r];
  };

  const edge = (limb: Limb, side: 1 | -1, from: number) => {
    const count = Math.max(1, Math.ceil((limb.length - from) / STEP));

    return Array.from({ length: count + 1 }, (_, step) =>
      edgePoint(limb, side, from + ((limb.length - from) * step) / count),
    );
  };

  // The rounded fingertip, from the left edge over the tip to the right edge.
  const cap = (limb: Limb) => {
    const point = screenAt(limb, limb.length);
    const [tx, ty] = tangentAt(limb, limb.length);
    const r = radiusAt(limb, limb.length) * scaleBy;

    return [-60, -30, 0, 30, 60].map((degrees): Vec2 => {
      const sin = Math.sin(degrees * DEG);
      const cos = Math.cos(degrees * DEG);
      const reach = r * (1 + 0.15 * cos);

      return [
        point.x + (tx * cos - ty * sin) * reach,
        point.y + (tx * sin + ty * cos) * reach,
      ];
    });
  };

  // The visible outline of a digit is open at its base, where it merges into
  // the hand; the shape used to hide what is behind it is closed and reaches a
  // little into the palm.
  const outlineOf = (limb: Limb) =>
    smoothPath([
      ...edge(limb, -1, limb.digit.starts[0]),
      ...cap(limb),
      ...edge(limb, 1, limb.digit.starts[1]).toReversed(),
    ]);

  const shapeOf = (limb: Limb) =>
    `${smoothPath([...edge(limb, -1, limb.digit.root), ...cap(limb), ...edge(limb, 1, limb.digit.root).toReversed()])}Z`;

  // A skin crease over the back of a joint, when that side faces the viewer.
  const creaseAt = (limb: Limb, joint: number) => {
    const [before, after] = [limb.bones[joint - 1], limb.bones[joint]];

    if (!before || !after) return "";
    const dorsal = normalize(add(before.dorsal, after.dorsal));
    const along = normalize(add(before.direction, after.direction));

    if (direction(dorsal).depth < 0.2) return "";
    const across = cross(along, dorsal);
    const r = radiusAt(limb, after.from) * 0.95;
    const [start, through, end] = [-45, 0, 45].map((degrees): Vec2 => {
      const point = project(
        add(
          add(after.start, scale(dorsal, r * Math.cos(degrees * DEG))),
          scale(across, r * Math.sin(degrees * DEG)),
        ),
      );

      return [point.x, point.y];
    });

    return start && through && end ? quadraticThrough(start, through, end) : "";
  };

  // The web of skin between two neighbouring fingers.
  const webBetween = (left: Limb, right: Limb) => {
    const start = edgePoint(left, 1, left.digit.starts[1]);
    const end = edgePoint(right, -1, right.digit.starts[0]);
    const [tx, ty] = tangentAt(right, right.digit.starts[0]);
    const dip = 5 * scaleBy;
    const through: Vec2 = [
      (start[0] + end[0]) / 2 - tx * dip,
      (start[1] + end[1]) / 2 - ty * dip,
    ];

    return quadraticThrough(start, through, end);
  };

  const layerOf = (
    key: DigitName,
    limb: Limb,
    details: readonly string[],
  ): Layer => ({
    key,
    outline: outlineOf(limb),
    shape: shapeOf(limb),
    details: [creaseAt(limb, 1), creaseAt(limb, 2), ...details].join(""),
  });

  // Nearest first; each layer hides the outlines of the ones after it.
  const layers: readonly Layer[] = [
    layerOf("thumb", thumb, []),
    layerOf("index", index, []),
    layerOf("middle", middle, [webBetween(index, middle)]),
    layerOf("ring", ring, [webBetween(middle, ring)]),
    layerOf("pinky", pinky, [webBetween(ring, pinky)]),
  ];

  const arm = (point: Vec3): Vec2 => {
    const { x, y } = project(point, false);

    return [x, y];
  };

  const hand = (point: Vec3): Vec2 => {
    const { x, y } = project(point);

    return [x, y];
  };

  // The little-finger side of the palm, from the wrist to where the pinky's
  // outer outline begins: one curve that leaves the wrist along the forearm
  // and arrives along the pinky's edge, so neither end shows a corner.
  const heelSide = (forearm: readonly Vec2[]) => {
    const [previous, start] = forearm.slice(-2);

    if (!previous || !start) return "";
    const away = Math.hypot(start[0] - previous[0], start[1] - previous[1]);
    const end = edgePoint(pinky, 1, PALM);
    const [tx, ty] = tangentAt(pinky, PALM);
    const reach = 24 * scaleBy;
    const leave: Vec2 = [
      start[0] + ((start[0] - previous[0]) / away) * reach,
      start[1] + ((start[1] - previous[1]) / away) * reach,
    ];
    const arrive: Vec2 = [end[0] - tx * reach, end[1] - ty * reach];

    return `${smoothPath(forearm)}C${pointString(leave)} ${pointString(arrive)} ${pointString(end)}`;
  };

  // The forearm and palm, as the two sides of their silhouette: up the thumb
  // side into the index finger and up the little-finger side into the pinky.
  // The thumb side is nearer, so its silhouette is the palm's underside edge.
  const body: readonly string[] = [
    smoothPath([
      ...forearm[0].map((point) => arm(point)),
      edgePoint(thumb, -1, THENAR),
    ]),
    heelSide(forearm[1].map((point) => arm(point))),
  ];

  // The wide web between the thumb and the index finger: from the inside of
  // the thumb's knuckle, down the edge of the palm and up into the index.
  const details = smoothPath([
    edgePoint(thumb, 1, thumb.digit.starts[1]),
    hand(web[0]),
    hand(web[1]),
    edgePoint(index, -1, index.digit.starts[0]),
  ]);

  // The nail is a band wrapped round the fingertip, reaching NAIL_WRAP either
  // side of the back of the finger. What shows is the part of that arc that
  // faces the viewer, so turned side-on the nail keeps its width as its
  // visible edge rides round to the finger's silhouette, rather than
  // thinning to a sliver the way a flat shape would.
  const nailOf = (limb: Limb): NailPose => {
    const bone = limb.last;
    const r = radiusAt(limb, bone.from + bone.length * 0.6) * 0.98;
    const scaleY = (0.5 * bone.length + 7) / 122;
    // Sits up at the fingertip: the nail's cuticle end starts past the
    // middle of the last bone, and its free edge reaches past the tip.
    const axis = add(
      bone.start,
      scale(bone.direction, 0.7 * bone.length + 52 * scaleY),
    );
    const side = normalize(cross(bone.direction, bone.dorsal));
    // How much the arc faces the viewer, by angle round the finger: a cosine
    // peaking where the surface normal points straight out of the screen.
    const facingDorsal = direction(bone.dorsal).depth;
    const facingSide = direction(side).depth;
    const peak = Math.atan2(facingSide, facingDorsal) / DEG;
    const wrap = NAIL_WRAP * (limb.digit.nailWrap ?? 1);
    const from = Math.max(-wrap, peak - 90);
    const to = Math.min(wrap, peak + 90);
    const rim = (degrees: number) =>
      project(
        add(
          axis,
          add(
            scale(bone.dorsal, r * Math.cos(degrees * DEG)),
            scale(side, r * Math.sin(degrees * DEG)),
          ),
        ),
      );
    const left = rim(from);
    const right = rim(to);
    const along = direction(scale(bone.direction, -scaleY));

    return {
      a: (right.x - left.x) / 48,
      b: (right.y - left.y) / 48,
      c: along.x,
      d: along.y,
      e: (left.x + right.x) / 2,
      f: (left.y + right.y) / 2,
      angle: Math.atan2(-along.x, along.y) / DEG,
      facing: direction(bone.dorsal).depth,
    };
  };

  const nails: readonly NailPose[] = [thumb, index, middle, ring, pinky].map(
    (limb) => nailOf(limb),
  );

  return { layers, body, details, nails };
};

const nailTransform = ({ a, b, c, d, e, f }: NailPose) =>
  `matrix(${[a, b, c, d, e, f].map((value) => value.toFixed(3)).join(" ")})`;

// Canvas position of a point in a nail's own coordinates.
const nailPoint = (nail: NailPose, localX: number, localY: number) => ({
  x: nail.e + nail.a * localX + nail.c * localY,
  y: nail.f + nail.b * localX + nail.d * localY,
});

interface PathState {
  out: readonly string[];
  command: string;
  x: number;
  numbers: readonly number[];
}

// Moves an absolute M/L/V/C/Z path (the nail drawings) onto a nail, so its
// stroke keeps an even width however much the nail is foreshortened.
const placePath = (path: string, nail: NailPose) => {
  const tokens = path.match(/[A-Z]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
  const parts = tokens.reduce<PathState>(
    (state, token) => {
      if (/[A-Z]/.test(token)) {
        return {
          ...state,
          command: token,
          out: token === "Z" ? [...state.out, "Z"] : state.out,
        };
      }
      const numbers = [...state.numbers, Number(token)];

      if (state.command === "V") {
        const { x, y } = nailPoint(nail, state.x, numbers[0] ?? 0);

        return {
          ...state,
          numbers: [],
          out: [...state.out, `L${format(x)} ${format(y)}`],
        };
      }
      const arity = state.command === "C" ? 6 : 2;

      if (numbers.length < arity) return { ...state, numbers };
      const pairs = Array.from({ length: arity / 2 }, (_, pair) =>
        nailPoint(nail, numbers[pair * 2] ?? 0, numbers[pair * 2 + 1] ?? 0),
      );
      const coordinates = pairs.map(({ x, y }) => `${format(x)} ${format(y)}`);

      return {
        ...state,
        numbers: [],
        x: numbers.at(-2) ?? state.x,
        out: [...state.out, `${state.command}${coordinates.join(" ")}`],
      };
    },
    { out: [], command: "M", x: 0, numbers: [] },
  );

  return parts.out.join("");
};

export {
  buildHand,
  DIGIT_NAMES,
  lean,
  nailPoint,
  nailTransform,
  OUT,
  PALM,
  placePath,
  THENAR,
  WEB,
};

export type {
  Digit,
  DigitName,
  Hand,
  HandSpec,
  HandView,
  NailPose,
  Vec2,
  Vec3,
};
