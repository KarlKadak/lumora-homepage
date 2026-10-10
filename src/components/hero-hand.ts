import {
  buildHand as buildHandFrom,
  type Digit,
  type Hand,
  type HandSpec,
  lean,
  OUT,
  PALM,
  THENAR,
  WEB,
} from "@/components/hand-model";

// The hero hand: a slender right hand held up and relaxed, seen from the back
// and a little from the thumb side. The fingers curl and overlap, and the
// whole hand turns slowly in the hero. The geometry lives in hand-model.ts;
// this is the pose.

// How the hand sits in the arch: turned towards its thumb side so the
// fingers overlap, seen slightly from above, the wrist bent back as a hand
// held up is, and the whole arm leaning in from the lower left.
const VIEW = {
  yaw: 40,
  pitch: 16,
  roll: 10,
  extension: 24,
  scale: 1.92,
  wrist: [186, 410] as const,
};

// The close-up, for admiring a chosen finish: the hand fills the arch and
// the wrist itself drops out of view. `zoom` runs from 0 (VIEW) to 1 (this).
const CLOSE_UP = { scale: 3.17, wrist: [190, 575] as const };

const THUMB: Digit = {
  base: [-21, 2, -10],
  heading: [-0.45, 0.8, -0.25],
  dorsal: [-0.8, 0, 0.6],
  bones: [46, 30, 26],
  curl: [0, 24, 38],
  radii: [13.5, 9.2, 8, 6.2],
  starts: [THENAR, 62],
  root: THENAR,
  nailWrap: 0.8,
};

const INDEX: Digit = {
  base: [-27, 74, -7],
  heading: lean(-6),
  dorsal: OUT,
  bones: [40, 24, 21],
  curl: [10, 30, 20],
  radii: [8.6, 7.2, 6.2, 5.3],
  starts: [-2, WEB],
  root: PALM,
};

const MIDDLE: Digit = {
  base: [-9, 79, -7],
  heading: lean(-1),
  dorsal: OUT,
  bones: [44, 27, 22],
  curl: [18, 36, 18],
  radii: [7.8, 7.2, 6.4, 5.4],
  starts: [WEB, WEB],
  root: PALM,
};

const RING: Digit = {
  base: [9, 76, -7],
  heading: lean(3),
  dorsal: OUT,
  bones: [41, 26, 21],
  curl: [22, 42, 20],
  radii: [7.3, 6.8, 6.1, 5.1],
  starts: [WEB, WEB],
  root: PALM,
};

const PINKY: Digit = {
  base: [29, 67, -7],
  heading: lean(9),
  dorsal: OUT,
  bones: [31, 20, 18],
  curl: [24, 42, 20],
  radii: [6.8, 5.9, 5.2, 4.4],
  starts: [WEB, PALM],
  root: PALM,
};

const HERO: HandSpec = {
  digits: {
    thumb: THUMB,
    index: INDEX,
    middle: MIDDLE,
    ring: RING,
    pinky: PINKY,
  },
  view: VIEW,
  closeUp: CLOSE_UP,
  forearm: [
    [
      [-27.5, -170, 0],
      [-25, -70, 0],
      [-24.5, -24, 0],
    ],
    [
      [28.5, -170, 0],
      [26.5, -70, 0],
      [25.5, -24, 0],
    ],
  ],
  web: [
    [-39, 55, -11],
    [-34.5, 61, -11],
  ],
};

// Projects the hero hand at the given yaw, `zoom` of the way to the close-up.
const buildHand = (yaw: number, zoom = 0): Hand =>
  buildHandFrom(HERO, yaw, zoom);

// The hand as first served, at its resting yaw.
const HAND = buildHand(VIEW.yaw);

export { buildHand, HAND, HERO, VIEW };
