import {
  buildHand,
  type Digit,
  type Hand,
  type HandSpec,
  type HandView,
  lean,
  OUT,
  PALM,
  THENAR,
  WEB,
} from "@/components/hand-model";

// The nail designer's hand: a flat right hand seen from the back, fingers
// close together with even gaps and a faintly relaxed curl, slender digits,
// a narrow palm and forearm, the thumb held near the hand. The pose is
// docs/nail-designer-hand.md; the numbers there are final.

const DEG = Math.PI / 180;

// The frame the hand is drawn in: the wrist sits at the bottom so the
// forearm runs off the edge.
const FRAME = { width: 400, height: 560 } as const;

// Digit half-widths are the hero's scaled down for a slimmer hand.
const SLIM = 0.92;
const slim = (radii: readonly number[]) => radii.map((r) => r * SLIM);

const THUMB_LEAN = -32;

const THUMB: Digit = {
  base: [-21, 2, -10],
  heading: [
    Math.sin(THUMB_LEAN * DEG) * 0.95,
    Math.cos(THUMB_LEAN * DEG) * 0.95,
    -0.22,
  ],
  // Unchanged from the hero, so the thumb's nail reads from the side the
  // way a flat hand's thumb does.
  dorsal: [-0.8, 0, 0.6],
  bones: [46, 30, 26],
  curl: [0, 6, 8],
  radii: slim([13.5, 9.2, 8, 6.2]),
  starts: [THENAR, 62],
  root: THENAR,
  nailWrap: 0.8,
};

const RELAXED = [2, 5, 6];

const INDEX: Digit = {
  base: [-26.22, 74, -7],
  heading: lean(-9),
  dorsal: OUT,
  bones: [40, 24, 21],
  curl: RELAXED,
  radii: slim([8.6, 7.2, 6.2, 5.3]),
  starts: [-2, WEB],
  root: PALM,
};

const MIDDLE: Digit = {
  base: [-8.74, 79, -7],
  heading: lean(-3),
  dorsal: OUT,
  bones: [44, 27, 22],
  curl: RELAXED,
  radii: slim([7.8, 7.2, 6.4, 5.4]),
  starts: [WEB, WEB],
  root: PALM,
};

const RING: Digit = {
  base: [8.74, 76, -7],
  heading: lean(3),
  dorsal: OUT,
  bones: [41, 26, 21],
  curl: RELAXED,
  radii: slim([7.3, 6.8, 6.1, 5.1]),
  starts: [WEB, WEB],
  root: PALM,
};

const PINKY: Digit = {
  base: [27.94, 67, -7],
  heading: lean(9),
  dorsal: OUT,
  bones: [31, 20, 18],
  curl: RELAXED,
  radii: slim([6.8, 5.9, 5.2, 4.4]),
  starts: [WEB, PALM],
  root: PALM,
};

// Straight on. The wrist x is not the frame's centre: the hand's drawn
// extent (outlines plus nails) is centred instead, and it must not shift
// when the nail form changes, so the offset is fixed here.
const VIEW: HandView = {
  yaw: 0,
  pitch: 0,
  roll: 0,
  extension: 0,
  scale: 2.15,
  wrist: [233.95, 548],
};

const BUILDER: HandSpec = {
  digits: {
    thumb: THUMB,
    index: INDEX,
    middle: MIDDLE,
    ring: RING,
    pinky: PINKY,
  },
  view: VIEW,
  forearm: [
    [
      [-25, -170, 0],
      [-22.5, -70, 0],
      [-22, -24, 0],
    ],
    [
      [26, -170, 0],
      [24, -70, 0],
      [23, -24, 0],
    ],
  ],
  web: [
    [-39, 55, -11],
    [-34.5, 61, -11],
  ],
};

const BUILDER_HAND: Hand = buildHand(BUILDER);

const point = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// A faint crease across the wrist, in screen space.
const wristCrease = ({ scale: k, wrist: [wx, wy] }: HandView) => {
  const y = wy - 4 * k;

  return `M${point(wx - 21 * k, y)}Q${point(wx, y + 4 * k)} ${point(wx + 20 * k, y - k)}`;
};

const WRIST_CREASE = wristCrease(VIEW);

export { BUILDER, BUILDER_HAND, FRAME, WRIST_CREASE };
