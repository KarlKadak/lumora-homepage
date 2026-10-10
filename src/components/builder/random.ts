import {
  ELEMENT_COLORS,
  FINISHES,
  POLISHES,
} from "@/components/builder/color-panel";
import { ELEMENTS } from "@/components/builder/elements";
import type {
  Finger,
  HandState,
  NailDesign,
  NailElement,
  Paint,
} from "@/components/builder/state";
import { FINGERS } from "@/components/builder/state";
import {
  type Level,
  LEVELS,
  type NailForm,
  tipY,
} from "@/components/nail-form";

// Random forms, colours and designs. The randomness comes in as a function
// so the generators stay pure.

type Random = () => number;

const pick = <T>(items: readonly T[], random: Random): T => {
  const item = items[Math.floor(random() * items.length)];

  if (item === undefined) throw new Error("Nothing to pick from");

  return item;
};

const between = (min: number, max: number, random: Random) =>
  min + (max - min) * random();

const randomLevel = (random: Random): Level => pick(LEVELS, random);

const randomForm = (random: Random): NailForm => ({
  length: randomLevel(random),
  shape: randomLevel(random),
  sharpness: randomLevel(random),
});

const randomPaint = (random: Random): Paint =>
  random() < 0.7 ?
    { kind: "solid", hex: pick(POLISHES, random).hex }
  : { kind: "finish", id: pick(FINISHES, random) };

// A colour that is not the polish itself.
const randomColor = (paint: Paint, random: Random) =>
  pick(
    ELEMENT_COLORS.filter(
      (color) => paint.kind !== "solid" || color !== paint.hex,
    ),
    random,
  );

const randomElement = (
  kind: NailElement["kind"],
  paint: Paint,
  length: Level,
  random: Random,
  makeId: () => string,
): NailElement => {
  const definition = pick(ELEMENTS[kind], random);
  const top = tipY(length);
  const pattern = kind === "pattern";

  return {
    id: makeId(),
    kind,
    variant: definition.variant,
    x: pattern ? 0 : between(-12, 12, random),
    y: pattern ? 0 : between(top + 22, 36, random),
    scale: pattern ? 1 : between(0.8, 1.5, random),
    rotation: pattern ? 0 : between(-30, 30, random),
    flip: random() < 0.3,
    color:
      kind === "stone" ?
        pick(["crystal", "ab", "rose", "gold", "black", "emerald"], random)
      : randomColor(paint, random),
    ...(definition.color2 === undefined ? {} : { color2: definition.color2 }),
    ...(definition.offset === undefined ?
      {}
    : { offset: between(0.25, 0.75, random) }),
  };
};

// A pattern to suit the polish, for the design section's shuffle.
const randomPattern = (
  paint: Paint,
  length: Level,
  random: Random,
  makeId: () => string,
): NailElement => randomElement("pattern", paint, length, random, makeId);

// A polish, perhaps a pattern, and a few stones or illustrations.
const randomDesign = (
  length: Level,
  random: Random,
  makeId: () => string,
): NailDesign => {
  const paint = randomPaint(random);
  const pattern =
    random() < 0.55 ?
      [randomElement("pattern", paint, length, random, makeId)]
    : [];
  const extras = Array.from({ length: Math.floor(random() * 3) }, () =>
    randomElement(
      random() < 0.5 ? "stone" : "illustration",
      paint,
      length,
      random,
      makeId,
    ),
  );

  return { paint, elements: [...pattern, ...extras] };
};

const withFreshIds = (
  design: NailDesign,
  makeId: () => string,
): NailDesign => ({
  ...design,
  elements: design.elements.map((element) => ({ ...element, id: makeId() })),
});

// A whole set: one design on every nail, or on all but one accent nail.
const randomSet = (random: Random, makeId: () => string): HandState => {
  const form = randomForm(random);
  const base = randomDesign(form.length, random, makeId);
  const accentFinger: Finger | undefined =
    random() < 0.5 ? undefined : pick(FINGERS, random);
  const accent =
    accentFinger === undefined ? undefined : (
      randomDesign(form.length, random, makeId)
    );

  return {
    form,
    nails: FINGERS.map((finger) =>
      withFreshIds(finger === accentFinger && accent ? accent : base, makeId),
    ),
  };
};

export {
  randomDesign,
  randomForm,
  randomLevel,
  randomPaint,
  randomPattern,
  randomSet,
};
