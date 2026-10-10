import {
  DEFAULT_FORM,
  type Level,
  LEVELS,
  type NailForm,
} from "@/components/nail-form";

// The designer's state: two hands, each with a nail form shared by its five
// nails and a design (paint plus placed elements) per nail. Pure functions
// only, so the reducer can be unit-tested and the default state is the same
// on the server and the client.

type Side = "right" | "left";
// Thumb to little finger, like the hand model's nails.
type Finger = 0 | 1 | 2 | 3 | 4;

const FINGERS: readonly Finger[] = [0, 1, 2, 3, 4];
const SIDES: readonly Side[] = ["right", "left"];

// A solid hex colour or a special finish from the gradient catalogue.
type Paint = { kind: "solid"; hex: string } | { kind: "finish"; id: string };

type ElementKind = "pattern" | "illustration" | "stone";

interface NailElement {
  id: string;
  kind: ElementKind;
  // Catalogue key.
  variant: string;
  // Nail-local centre of the element.
  x: number;
  y: number;
  // 1 is the catalogue size.
  scale: number;
  // Degrees.
  rotation: number;
  flip: boolean;
  // A hex colour, or a stone colour key for stones; patterns may also use
  // a second colour and a 0–1 setting (tip depth, moon height, angle).
  color: string;
  color2?: string;
  offset?: number;
}

interface NailDesign {
  paint: Paint;
  elements: readonly NailElement[];
}

interface HandState {
  form: NailForm;
  // Always five, thumb first.
  nails: readonly NailDesign[];
}

interface DesignerState {
  right: HandState;
  // Undefined means "mirror the right hand": the left hand is derived until
  // the visitor first edits it, which materialises a copy.
  left: HandState | undefined;
}

interface Target {
  side: Side;
  finger: Finger;
}

const DEFAULT_PAINT: Paint = { kind: "solid", hex: "#cf8e80" };

const emptyNail = (): NailDesign => ({ paint: DEFAULT_PAINT, elements: [] });

const DEFAULT_HAND: HandState = {
  form: DEFAULT_FORM,
  nails: FINGERS.map(() => emptyNail()),
};

const INITIAL_STATE: DesignerState = { right: DEFAULT_HAND, left: undefined };

// The hand as drawn: the left hand follows the right until it is edited.
const handOf = (state: DesignerState, side: Side): HandState =>
  side === "right" ? state.right : (state.left ?? state.right);

const nailOf = (state: DesignerState, { side, finger }: Target): NailDesign =>
  handOf(state, side).nails[finger] ?? emptyNail();

const withHand = (
  state: DesignerState,
  side: Side,
  update: (hand: HandState) => HandState,
): DesignerState =>
  side === "right" ?
    { ...state, right: update(state.right) }
  : { ...state, left: update(handOf(state, "left")) };

const withNails = (
  state: DesignerState,
  side: Side,
  fingers: readonly Finger[],
  update: (nail: NailDesign, finger: Finger) => NailDesign,
): DesignerState =>
  withHand(state, side, (hand) => ({
    ...hand,
    nails: hand.nails.map((nail, index) => {
      const finger = FINGERS[index];

      return finger !== undefined && fingers.includes(finger) ?
          update(nail, finger)
        : nail;
    }),
  }));

const withElements = (
  state: DesignerState,
  target: Target,
  update: (elements: readonly NailElement[]) => readonly NailElement[],
) =>
  withNails(state, target.side, [target.finger], (nail) => ({
    ...nail,
    elements: update(nail.elements),
  }));

// The same element as seen in a mirror, for copies to the other hand.
const mirrored = (element: NailElement): NailElement => ({
  ...element,
  x: -element.x,
  rotation: -element.rotation,
  flip: !element.flip,
});

type Action =
  | { type: "form"; form: Partial<NailForm> }
  | { type: "paint"; side: Side; fingers: readonly Finger[]; paint: Paint }
  | { type: "add"; target: Target; element: NailElement }
  | {
      type: "update";
      target: Target;
      id: string;
      patch: Partial<Omit<NailElement, "id">>;
    }
  | { type: "remove"; target: Target; id: string }
  | { type: "reorder"; target: Target; id: string; by: 1 | -1 }
  | { type: "duplicate"; target: Target; id: string; newId: string }
  | {
      type: "copy";
      from: Target;
      // Each copy needs fresh element ids: given per target, or derived
      // from `seed` (unique per action) and the target.
      to: readonly { target: Target; ids?: readonly string[] }[];
      seed: string;
      mirror: boolean;
    }
  // Several steps as one, so they undo together.
  | { type: "batch"; actions: readonly Action[] }
  // Replaces one nail's design, or whole hands (a random set).
  | { type: "replace"; target: Target; design: NailDesign }
  | { type: "hands"; right: HandState; left: HandState | undefined }
  | { type: "matchRight" }
  | { type: "reset" };

const reduce = (state: DesignerState, action: Action): DesignerState => {
  switch (action.type) {
    // Length, shape and sharpness are one setting for both hands.
    case "form": {
      const form = { ...state.right.form, ...action.form };

      return {
        right: { ...state.right, form },
        left: state.left ? { ...state.left, form } : undefined,
      };
    }
    case "paint": {
      return withNails(state, action.side, action.fingers, (nail) => ({
        ...nail,
        paint: action.paint,
      }));
    }
    case "add": {
      return withElements(state, action.target, (elements) => [
        ...elements,
        action.element,
      ]);
    }
    case "update": {
      return withElements(state, action.target, (elements) =>
        elements.map((element) =>
          element.id === action.id ? { ...element, ...action.patch } : element,
        ),
      );
    }
    case "remove": {
      return withElements(state, action.target, (elements) =>
        elements.filter((element) => element.id !== action.id),
      );
    }
    case "reorder": {
      return withElements(state, action.target, (elements) => {
        const index = elements.findIndex((element) => element.id === action.id);
        const other = index + action.by;
        const a = elements[index];
        const b = elements[other];

        if (index === -1 || !a || !b) return elements;

        return elements.map((element, at) =>
          at === index ? b
          : at === other ? a
          : element,
        );
      });
    }
    case "duplicate": {
      return withElements(state, action.target, (elements) => {
        const source = elements.find((element) => element.id === action.id);

        return source ?
            [
              ...elements,
              { ...source, id: action.newId, x: source.x + 4, y: source.y + 4 },
            ]
          : elements;
      });
    }
    case "copy": {
      const source = nailOf(state, action.from);

      return action.to.reduce(
        (done, { target, ids }) =>
          withNails(done, target.side, [target.finger], () => ({
            paint: source.paint,
            elements: source.elements.map((element, index) => {
              const copy = {
                ...element,
                id:
                  ids?.[index] ??
                  `${action.seed}-${target.side}${String(target.finger)}-${String(index)}`,
              };

              return action.mirror && target.side !== action.from.side ?
                  mirrored(copy)
                : copy;
            }),
          })),
        state,
      );
    }
    case "replace": {
      return withNails(
        state,
        action.target.side,
        [action.target.finger],
        () => action.design,
      );
    }
    case "hands": {
      return {
        right: action.right,
        left:
          action.left ? { ...action.left, form: action.right.form } : undefined,
      };
    }
    case "batch": {
      return action.actions.reduce((done, step) => reduce(done, step), state);
    }
    case "matchRight": {
      return { ...state, left: undefined };
    }
    case "reset": {
      return INITIAL_STATE;
    }
  }
};

// Undo history. Consecutive slider moves on the same control collapse into
// one step, so dragging a slider does not fill the stack.
interface History {
  past: readonly DesignerState[];
  present: DesignerState;
  future: readonly DesignerState[];
  // What the last step changed, for collapsing.
  key: string | undefined;
}

const HISTORY_LIMIT = 50;

type HistoryAction =
  | Action
  | { type: "undo" }
  | { type: "redo" }
  // Replaces everything without an undo step (a restored draft).
  | { type: "load"; state: DesignerState };

const historyOf = (state: DesignerState): History => ({
  past: [],
  present: state,
  future: [],
  key: undefined,
});

const INITIAL_HISTORY = historyOf(INITIAL_STATE);

const keyOf = (action: Action): string | undefined => {
  switch (action.type) {
    case "form": {
      return `form:${Object.keys(action.form).join(",")}`;
    }
    case "update": {
      return `update:${action.target.side}:${String(action.target.finger)}:${action.id}:${Object.keys(action.patch).join(",")}`;
    }
    case "batch": {
      const first = action.actions[0];
      const key = first && keyOf(first);

      return key === undefined ? undefined : `batch:${key}`;
    }
    default: {
      return undefined;
    }
  }
};

const reduceHistory = (history: History, action: HistoryAction): History => {
  switch (action.type) {
    case "undo": {
      const previous = history.past.at(-1);

      return previous ?
          {
            past: history.past.slice(0, -1),
            present: previous,
            future: [history.present, ...history.future],
            key: undefined,
          }
        : history;
    }
    case "redo": {
      const [next, ...rest] = history.future;

      return next ?
          {
            past: [...history.past, history.present],
            present: next,
            future: rest,
            key: undefined,
          }
        : history;
    }
    case "load": {
      return historyOf(action.state);
    }
    default: {
      const present = reduce(history.present, action);

      if (present === history.present) return history;
      const key = keyOf(action);
      const collapse = key !== undefined && key === history.key;

      return {
        past:
          collapse ?
            history.past
          : [...history.past, history.present].slice(-HISTORY_LIMIT),
        present,
        future: [],
        key,
      };
    }
  }
};

// Equality, for deciding whether nails differ in the export.
const round = (value: number) => Math.round(value * 10) / 10;

const elementKey = (element: NailElement) =>
  [
    element.kind,
    element.variant,
    round(element.x),
    round(element.y),
    round(element.scale),
    round(element.rotation),
    element.flip ? 1 : 0,
    element.color,
    element.color2 ?? "",
    element.offset === undefined ? "" : round(element.offset),
  ].join("|");

const paintKey = (paint: Paint) =>
  paint.kind === "solid" ? `s:${paint.hex}` : `f:${paint.id}`;

const designKey = (design: NailDesign) =>
  `${paintKey(design.paint)};${design.elements.map((element) => elementKey(element)).join(";")}`;

const formKey = (form: NailForm) =>
  `${String(form.length)}${String(form.shape)}${String(form.sharpness)}`;

const sameDesign = (a: NailDesign, b: NailDesign) =>
  designKey(a) === designKey(b);

const nailKey = (hand: HandState, finger: Finger) =>
  `${formKey(hand.form)}/${designKey(hand.nails[finger] ?? emptyNail())}`;

// The hand as its mirror image: the left hand is a copy of the right when
// this of it keys the same as the right.
const mirroredHand = (hand: HandState): HandState => ({
  ...hand,
  nails: hand.nails.map((nail) => ({
    ...nail,
    elements: nail.elements.map((element) => mirrored(element)),
  })),
});

// Compact JSON for the share link and the draft: short keys, rounded
// numbers. Decoding validates every field, since the input is untrusted.
interface PackedElement {
  k: ElementKind;
  v: string;
  x: number;
  y: number;
  s: number;
  r: number;
  f?: 1;
  c: string;
  c2?: string;
  o?: number;
}

interface PackedNail {
  p: string;
  e?: readonly PackedElement[];
}

interface PackedHand {
  f: readonly [number, number, number];
  n: readonly PackedNail[];
}

interface Packed {
  v: 1;
  r: PackedHand;
  l?: PackedHand;
}

const packPaint = (paint: Paint) =>
  paint.kind === "solid" ? paint.hex : `#${paint.id}`.replace("#", "@");

const unpackPaint = (value: string): Paint | undefined => {
  if (/^#[\da-f]{6}$/i.test(value)) return { kind: "solid", hex: value };
  if (/^@[\w-]{1,32}$/.test(value))
    return { kind: "finish", id: value.slice(1) };
  return undefined;
};

const packElement = (element: NailElement): PackedElement => ({
  k: element.kind,
  v: element.variant,
  x: round(element.x),
  y: round(element.y),
  s: round(element.scale),
  r: round(element.rotation),
  ...(element.flip ? { f: 1 } : {}),
  c: element.color,
  ...(element.color2 === undefined ? {} : { c2: element.color2 }),
  ...(element.offset === undefined ? {} : { o: round(element.offset) }),
});

const packHand = (hand: HandState): PackedHand => ({
  f: [hand.form.length, hand.form.shape, hand.form.sharpness],
  n: hand.nails.map((nail) => ({
    p: packPaint(nail.paint),
    ...(nail.elements.length > 0 ?
      { e: nail.elements.map((element) => packElement(element)) }
    : {}),
  })),
});

const pack = (state: DesignerState): Packed => ({
  v: 1,
  r: packHand(state.right),
  ...(state.left ? { l: packHand(state.left) } : {}),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLevel = (value: unknown): value is Level =>
  typeof value === "number" && LEVELS.some((level) => level === value);

const isKind = (value: unknown): value is ElementKind =>
  value === "pattern" || value === "illustration" || value === "stone";

const finite = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ?
    Math.min(Math.max(value, min), max)
  : fallback;

const isColor = (value: unknown): value is string =>
  typeof value === "string" && /^(#[\da-f]{6}|[a-z][\w-]{0,15})$/i.test(value);

const unpackElement = (value: unknown, id: string): NailElement | undefined => {
  if (!isRecord(value)) return undefined;
  if (
    !isKind(value.k) ||
    typeof value.v !== "string" ||
    !/^[\w-]{1,32}$/.test(value.v)
  )
    return undefined;
  if (!isColor(value.c)) return undefined;

  return {
    id,
    kind: value.k,
    variant: value.v,
    x: finite(value.x, 0, -60, 60),
    y: finite(value.y, 0, -160, 100),
    scale: finite(value.s, 1, 0.2, 4),
    rotation: finite(value.r, 0, -360, 360),
    flip: value.f === 1,
    color: value.c,
    ...(isColor(value.c2) ? { color2: value.c2 } : {}),
    ...(typeof value.o === "number" ?
      { offset: finite(value.o, 0.5, 0, 1) }
    : {}),
  };
};

const unpackHand = (
  value: unknown,
  makeId: () => string,
): HandState | undefined => {
  if (!isRecord(value) || !Array.isArray(value.f) || !Array.isArray(value.n))
    return undefined;
  const [length, shape, sharpness] = value.f as unknown[];

  if (!isLevel(length) || !isLevel(shape) || !isLevel(sharpness))
    return undefined;
  const nails = FINGERS.map((finger): NailDesign => {
    const nail: unknown = (value.n as unknown[])[finger];

    if (!isRecord(nail)) return emptyNail();
    const paint = typeof nail.p === "string" ? unpackPaint(nail.p) : undefined;
    const elements =
      Array.isArray(nail.e) ?
        (nail.e as unknown[])
          .slice(0, 40)
          .map((element) => unpackElement(element, makeId()))
          .filter((element) => element !== undefined)
      : [];

    return { paint: paint ?? DEFAULT_PAINT, elements };
  });

  return { form: { length, shape, sharpness }, nails };
};

const unpack = (
  value: unknown,
  makeId: () => string,
): DesignerState | undefined => {
  if (!isRecord(value) || value.v !== 1) return undefined;
  const right = unpackHand(value.r, makeId);

  if (!right) return undefined;
  const left = value.l === undefined ? undefined : unpackHand(value.l, makeId);

  return { right, left: left ? { ...left, form: right.form } : undefined };
};

export {
  DEFAULT_PAINT,
  designKey,
  emptyNail,
  FINGERS,
  handOf,
  INITIAL_HISTORY,
  INITIAL_STATE,
  mirrored,
  mirroredHand,
  nailKey,
  nailOf,
  pack,
  paintKey,
  reduce,
  reduceHistory,
  sameDesign,
  SIDES,
  unpack,
};

export type {
  Action,
  DesignerState,
  ElementKind,
  Finger,
  HandState,
  History,
  HistoryAction,
  NailDesign,
  NailElement,
  Paint,
  Side,
  Target,
};
