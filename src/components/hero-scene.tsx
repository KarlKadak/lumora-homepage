"use client";

import { useCallback, useId, useRef, useState } from "react";
import {
  type Hand,
  nailPoint,
  nailTransform,
  placePath,
} from "@/components/hand-model";
import { buildHand, HAND, VIEW } from "@/components/hero-hand";
import {
  CUTICLE,
  delay,
  GLOSS,
  NAIL,
  sparklePath,
} from "@/components/nail-art";
import {
  CLASSIC_FINISHES,
  type Finish,
  FINISHES,
  FinishSwatch,
  HeroFinishDefs,
  isGradient,
} from "@/components/nail-finishes";
import type { Picker } from "@/content/dictionary";

// A manicure on a loop: a hand held up in the arch, drawn in outline only,
// and the brush (which doubles as the bottle cap) lifts out, paints each nail
// from cuticle to tip along that nail's own direction, returns to the bottle
// and the next round brings the next shade. Server-rendered as bare nails
// with the bottle capped; the loop is driven by the Web Animations API once
// mounted. The finishes it cycles through live in nail-finishes.tsx.

// The loop opens on the classic shades, so the first of those paints first.
const FIRST_FINISH: Finish = CLASSIC_FINISHES[0] ?? {
  name: "rose",
  paint: "var(--color-rose)",
};
const FIRST_SHADE = FIRST_FINISH.paint;

// Fresh polish is uncovered from the cuticle up rather than scaled, so a
// gradient keeps its angle while it is painted on.
const COVERED = "inset(100% 0 0 0)";
const UNCOVERED = "inset(0 0 0 0)";

const ARCH = "M0 200A200 200 0 0 1 400 200V460Q400 500 360 500H40Q0 500 0 460Z";
const ARCH_INNER =
  "M12 200A188 188 0 0 1 388 200V458Q388 488 358 488H42Q12 488 12 458Z";

// The masks' extent: generous, so nothing is cut off as the hand turns.
const MASK_AREA = { x: -60, y: -60, width: 520, height: 680 };

const SPARKLES = [
  { x: 70, y: 180, size: 11 },
  { x: 330, y: 152, size: 15 },
  { x: 44, y: 400, size: 7 },
];

// The hand turns slowly from side to side about its own yaw, so the fingers
// overlap and foreshorten differently as it moves. It is re-projected every
// frame, and brush poses are functions of the current hand: a pose on a nail
// follows the nail round, a pose at the bottle stays put, and the brush is
// tweened between them frame by frame so it keeps up mid-stroke.
const TURN = { amplitude: 6, period: 14000 };

interface Pose {
  x: number;
  y: number;
  angle: number;
}

type PoseAt = (hand: Hand) => Pose;

const atBottle =
  (x: number, y: number, angle: number): PoseAt =>
  () => ({ x, y, angle });

// The brush is held much the same way for every nail, tilting a little
// towards each one.
const onNail =
  (index: number, localY: number): PoseAt =>
  (hand) => {
    const nail = hand.nails[index];

    if (!nail) return { x: 0, y: 0, angle: 0 };
    const { x, y } = nailPoint(nail, 0, localY);

    return { x, y, angle: 28 + nail.angle * 0.4 };
  };

const pose = ({ x, y, angle }: Pose) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(0.9)`;

const BRUSH_IN_BOTTLE = atBottle(425, 450, 0);
const BRUSH_ABOVE_BOTTLE = atBottle(425, 342, -12);
const BRUSH_HOME = pose(BRUSH_IN_BOTTLE(HAND));

// The bristle head, tip at the origin and ferrule at y = -26. It is drawn
// gathered to a soft point while travelling (spread 0) and splays out when it
// is pressed onto a nail (spread 1), the way a loaded brush does.
const n = (value: number) => value.toFixed(2);
const bristleShape = (spread: number) => {
  const tip = 1.2 + 6.3 * spread;
  const belly = tip + 0.8;
  const hair = tip * 0.55;

  return {
    head: `M-5.5-26C-5.5-16-${n(belly)}-6-${n(tip)}-1.6C-${n(tip * 0.7)}0.4 ${n(tip * 0.7)}0.4 ${n(tip)}-1.6C${n(belly)}-6 5.5-16 5.5-26Z`,
    hairs: `M-2.6-24C-2.8-15-${n(hair + 0.3)}-8-${n(hair)}-2.6M0-24V-1.8M2.6-24C2.8-15 ${n(hair + 0.3)}-8 ${n(hair)}-2.6`,
  };
};
const BRISTLES_GATHERED = bristleShape(0);

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

const inOut = (u: number) =>
  u < 0.5 ? 4 * u * u * u : 1 - (2 - 2 * u) ** 3 / 2;
const easeIn = (u: number) => u * u;

// Runs `step` with eased progress on every frame until `duration` is up.
const tween = (
  duration: number,
  ease: (u: number) => number,
  signal: AbortSignal,
  step: (progress: number) => void,
) =>
  new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const frame = (now: number) => {
      if (signal.aborted) {
        reject(new Error("aborted"));
        return;
      }
      const u = Math.min((now - start) / duration, 1);

      step(ease(u));
      if (u < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(frame);
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

// The elements whose geometry is re-projected as the hand turns.
interface LayerParts {
  shape: SVGElement;
  outline: SVGElement;
  creases: SVGElement;
}

interface NailParts {
  frame: SVGElement;
  // The nail's silhouette in `defs`, which the masks use to hide what lies
  // behind it.
  shape: SVGElement;
  rim: SVGElement;
  cuticle: SVGElement;
  base: SVGElement;
  decor: SVGElement;
  fresh: SVGElement;
  gloss: SVGElement;
}

interface SceneParts {
  layers: LayerParts[];
  body: SVGElement[];
  web: SVGElement;
  nails: NailParts[];
  brush: SVGElement;
  // Carries the mask that hides the brush behind fingers nearer than the
  // nail it is painting; the brush's own transform must not move the mask.
  cover: SVGElement;
  bristles: SVGElement;
  hairs: SVGElement;
  // The sparkle at a freshly painted tip, and the wrapper that masks it
  // behind nearer fingers the same way.
  pop: SVGElement;
  popCover: SVGElement;
  liquid: SVGElement;
  liquidGradient: SVGElement;
  // The next finish's design, shown in the bottle so the pot matches the
  // nails it will paint.
  // Two layers that take turns, so one design cross-fades into the next.
  liquidDecor: readonly [SVGElement, SVGElement];
}

// The self-running modes: the classic shades in their original order, or the
// whole catalogue shuffled.
type Cycle = "classic" | "random";

// What the loop should be doing: cycling through finishes by itself, or
// holding the visitor's pick. A pick or a restart interrupts the round in
// progress.
interface Director {
  mode: Cycle | "picked";
  // A finish the visitor asked for, painted next.
  request: Finish | undefined;
  // The order dealt for a cycling mode and how far along it the loop is.
  order: readonly Finish[];
  index: number;
  // Aborts the round in progress.
  round: AbortController;
  // Rouses the loop when it is idle in picked mode.
  wake: () => void;
  // The last round was cut short, so the brush must be brought home first.
  dirty: boolean;
}

interface Scene extends SceneParts {
  // Lives until unmount.
  master: AbortSignal;
  // Lives for one round; a pick cuts it short.
  signal: AbortSignal;
  // The hand as currently projected, updated every frame while the loop runs.
  hand: { current: Hand };
  // Where the brush was last sent, so the next move can start from there,
  // and where it actually is, for picking up after an interrupted move.
  cursor: { at: PoseAt; now: Pose };
  // How far the bristles are currently splayed, 0 gathered to 1 pressed.
  spread: { current: number };
  // How far the hand is zoomed in, 0 for the loop's framing to 1 for the
  // close-up on a chosen finish.
  zoom: { current: number; target: number };
  director: Director;
}

const findParts = (svg: SVGSVGElement): SceneParts | undefined => {
  const pick = (root: Element, selector: string) =>
    root.querySelector<SVGElement>(selector) ?? undefined;
  const layers = HAND.layers
    .map((layer) => {
      const shape = pick(svg, `#hero-${layer.key}`);
      const group = svg.querySelector(`[data-layer="${layer.key}"]`);
      const outline = group && pick(group, "[data-outline]");
      const creases = group && pick(group, "[data-creases]");

      return shape && outline && creases ?
          { shape, outline, creases }
        : undefined;
    })
    .filter((layer) => layer !== undefined);
  const body = [...svg.querySelectorAll<SVGElement>("[data-body]")];
  const web = pick(svg, "[data-web]");
  const nails = HAND.nails
    .map((_, index) => {
      const group = svg.querySelector(`[data-nail="${String(index)}"]`);
      const shape = pick(svg, `#hero-nail-${String(index)}`);
      const frame = group && pick(group, "[data-frame]");
      const rim = group && pick(group, "[data-rim]");
      const cuticle = group && pick(group, "[data-cuticle]");
      const base = group && pick(group, "[data-base]");
      const decor = group && pick(group, "[data-decor]");
      const fresh = group && pick(group, "[data-fresh]");
      const gloss = group && pick(group, "[data-gloss]");

      return (
          frame && shape && rim && cuticle && base && decor && fresh && gloss
        ) ?
          { frame, shape, rim, cuticle, base, decor, fresh, gloss }
        : undefined;
    })
    .filter((nail) => nail !== undefined);
  const brush = pick(svg, "[data-brush]");
  const cover = pick(svg, "[data-brush-cover]");
  const bristles = pick(svg, "[data-bristles]");
  const hairs = pick(svg, "[data-hairs]");
  const liquid = pick(svg, "[data-liquid]");
  const liquidGradient = pick(svg, "[data-liquid-gradient]");
  const liquidDecor = [
    ...svg.querySelectorAll<SVGElement>("[data-liquid-decor]"),
  ];
  const liquidDecorPair =
    liquidDecor[0] && liquidDecor[1] ?
      ([liquidDecor[0], liquidDecor[1]] as const)
    : undefined;
  const pop = pick(svg, "[data-pop]");
  const popCover = pick(svg, "[data-pop-cover]");

  return (
      web &&
        brush &&
        cover &&
        bristles &&
        hairs &&
        liquid &&
        liquidGradient &&
        liquidDecorPair &&
        pop &&
        popCover &&
        layers.length === HAND.layers.length &&
        body.length === HAND.body.length &&
        nails.length === HAND.nails.length
    ) ?
      {
        layers,
        body,
        web,
        nails,
        brush,
        cover,
        bristles,
        hairs,
        liquid,
        liquidGradient,
        liquidDecor: liquidDecorPair,
        pop,
        popCover,
      }
    : undefined;
};

// Writes a projected hand into the markup.
const applyHand = (parts: SceneParts, hand: Hand) => {
  for (const [index, layer] of hand.layers.entries()) {
    const target = parts.layers[index];

    if (target) {
      target.shape.setAttribute("d", layer.shape);
      target.outline.setAttribute("d", layer.outline);
      target.creases.setAttribute("d", layer.details);
    }
  }
  for (const [index, side] of hand.body.entries()) {
    parts.body[index]?.setAttribute("d", side);
  }
  parts.web.setAttribute("d", hand.details);
  for (const [index, nail] of hand.nails.entries()) {
    const target = parts.nails[index];

    if (target) {
      const outline = placePath(NAIL, nail);

      target.frame.setAttribute("transform", nailTransform(nail));
      target.shape.setAttribute("d", outline);
      target.rim.setAttribute("d", outline);
      target.cuticle.setAttribute("d", placePath(CUTICLE, nail));
      target.gloss.setAttribute("d", placePath(GLOSS, nail));
    }
  }
};

const startTurning = (scene: Scene) => {
  const start = performance.now();
  const frame = (now: number) => {
    if (scene.master.aborted) return;
    const yaw =
      VIEW.yaw +
      TURN.amplitude * Math.sin(((now - start) / TURN.period) * 2 * Math.PI);

    scene.hand.current = buildHand(yaw, scene.zoom.current);
    applyHand(scene, scene.hand.current);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const moveBrush = async (
  scene: Scene,
  to: PoseAt,
  duration: number,
  ease = inOut,
) => {
  const from = scene.cursor.at;

  scene.cursor.at = to;
  await tween(duration, ease, scene.signal, (progress) => {
    const a = from(scene.hand.current);
    const b = to(scene.hand.current);
    const mix = (p: number, q: number) => p + (q - p) * progress;

    scene.cursor.now = {
      x: mix(a.x, b.x),
      y: mix(a.y, b.y),
      angle: mix(a.angle, b.angle),
    };
    scene.brush.style.transform = pose(scene.cursor.now);
  });
};

const spreadBrush = async (scene: Scene, to: number, duration: number) => {
  const from = scene.spread.current;

  await tween(duration, inOut, scene.signal, (progress) => {
    scene.spread.current = from + (to - from) * progress;
    const { head, hairs } = bristleShape(scene.spread.current);

    scene.bristles.setAttribute("d", head);
    scene.hairs.setAttribute("d", hairs);
  });
};

// Lays a finish's decoration over a nail, or clears it. Decor is drawn above
// the base coat and below the fresh one, so the next coat paints over it.
const setDecor = (decor: SVGElement, finish: Finish) => {
  // The previous fade-in still holds the overlay at full opacity, so it is
  // cancelled before the new design is swapped in, or that would flash.
  for (const animation of decor.getAnimations()) {
    animation.cancel();
  }
  decor.style.opacity = "0";
  if (finish.decor) {
    decor.setAttribute("href", `#hero-decor-${finish.decor}`);
    decor.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 450,
      delay: 120,
      fill: "forwards",
    });
  } else {
    decor.removeAttribute("href");
  }
};

const paintNail = async (
  scene: Scene,
  index: number,
  { base, decor, fresh, gloss }: NailParts,
  finish: Finish,
  approach: number,
) => {
  const shade = finish.paint;

  const stroke = 560;

  if (index) {
    scene.cover.setAttribute("mask", `url(#hero-nail-behind-${String(index)})`);
  } else {
    scene.cover.removeAttribute("mask");
  }
  await moveBrush(scene, onNail(index, 50), approach);
  fresh.style.fill = shade;
  await Promise.all([
    moveBrush(scene, onNail(index, -64), stroke),
    animateTo(fresh, [{ clipPath: COVERED }, { clipPath: UNCOVERED }], stroke),
    spreadBrush(scene, 1, 160),
  ]);
  base.style.fill = shade;
  setDecor(decor, finish);
  fresh.style.clipPath = COVERED;
  // The bristles gather again as the brush lifts off towards the next nail.
  void spreadBrush(scene, 0, 240);

  // Fire-and-forget flourishes: a glint on the fresh polish and a sparkle.
  gloss.animate([{ opacity: 1, offset: 0.4 }, { opacity: 0.75 }], {
    duration: 700,
    fill: "forwards",
  });
  const tip = onNail(index, -78)(scene.hand.current);
  const at = `translate(${tip.x.toFixed(1)}px, ${tip.y.toFixed(1)}px)`;

  if (index) {
    scene.popCover.setAttribute(
      "mask",
      `url(#hero-nail-behind-${String(index)})`,
    );
  } else {
    scene.popCover.removeAttribute("mask");
  }
  scene.pop.animate(
    [
      { opacity: 0, transform: `${at} scale(0) rotate(0deg)` },
      { opacity: 1, transform: `${at} scale(1) rotate(90deg)`, offset: 0.4 },
      { opacity: 0, transform: `${at} scale(0) rotate(180deg)` },
    ],
    { duration: 800, easing: "ease-out" },
  );
};

// Gradients cannot transition, so the bottle fades a gradient layer in and
// out over its plain-coloured liquid.
const fillBottle = (
  scene: Pick<SceneParts, "liquid" | "liquidGradient" | "liquidDecor">,
  finish: Finish,
) => {
  if (isGradient(finish.paint)) {
    scene.liquidGradient.setAttribute("fill", finish.paint);
    scene.liquidGradient.style.opacity = "1";
  } else {
    scene.liquid.style.fill = finish.paint;
    scene.liquidGradient.style.opacity = "0";
  }
  // The design goes on whichever layer is hidden and fades in over the
  // other, which fades out; swapping a visible layer's href would be abrupt.
  const [a, b] = scene.liquidDecor;
  const showing = a.style.opacity === "1" ? a : b;
  const hidden = showing === a ? b : a;

  if (finish.decor) {
    const href = `#hero-decor-${finish.decor}`;

    if (showing.getAttribute("href") === href) return;
    hidden.setAttribute("href", href);
    hidden.style.opacity = "1";
  }
  showing.style.opacity = "0";
};

const paintRound = async (scene: Scene, finish: Finish, next: Finish) => {
  scene.bristles.style.fill = finish.paint;
  await moveBrush(scene, BRUSH_ABOVE_BOTTLE, 450);
  for (const [index, nail] of scene.nails.entries()) {
    await paintNail(scene, index, nail, finish, index === 0 ? 580 : 340);
  }
  // The brush keeps the last nail's mask on its way out, so it passes behind
  // the nearer fingers; it is in the clear once it is back at the bottle.
  await moveBrush(scene, BRUSH_ABOVE_BOTTLE, 620);
  await moveBrush(scene, BRUSH_IN_BOTTLE, 380, easeIn);
  scene.cover.removeAttribute("mask");
  fillBottle(scene, next);
  await sleep(1700, scene.signal);
};

// A random order, so every visit sees the finishes in a fresh sequence.
const shuffled = <T,>(items: readonly T[]) =>
  items
    .map((item) => ({ item, key: Math.random() }))
    .toSorted((a, b) => a.key - b.key)
    .map(({ item }) => item);

// Paints a finish straight on, for visitors who prefer reduced motion.
const paintAtOnce = (parts: SceneParts, finish: Finish) => {
  for (const nail of parts.nails) {
    nail.base.style.fill = finish.paint;
    setDecor(nail.decor, finish);
    nail.gloss.style.opacity = "0.75";
  }
};

// Glides the hand between the loop's framing and the close-up. Runs on the
// master signal, so a pick mid-zoom does not cut it short.
const zoomTo = async (scene: Scene, to: number) => {
  const from = scene.zoom.current;

  if (scene.zoom.target === to) return;
  scene.zoom.target = to;
  await tween(1400, inOut, scene.master, (progress) => {
    // A newer zoom takes over if the visitor changes their mind mid-glide.
    if (scene.zoom.target !== to) return;
    scene.zoom.current = from + (to - from) * progress;
  });
};

// After a round is cut short: any half-finished coat is wiped, the bristles
// gather, and the brush goes back to the bottle from wherever it was.
const recover = async (scene: Scene) => {
  for (const nail of scene.nails) {
    for (const animation of nail.fresh.getAnimations()) {
      animation.cancel();
    }
    nail.fresh.style.clipPath = COVERED;
  }
  scene.spread.current = 0;
  scene.bristles.setAttribute("d", BRISTLES_GATHERED.head);
  scene.hairs.setAttribute("d", BRISTLES_GATHERED.hairs);
  const here = scene.cursor.now;

  scene.cursor.at = () => here;
  await moveBrush(scene, BRUSH_ABOVE_BOTTLE, 500);
  await moveBrush(scene, BRUSH_IN_BOTTLE, 300, easeIn);
  scene.cover.removeAttribute("mask");
};

// One pass of the loop: whatever the director asks for, painted, or an idle
// wait when there is nothing to do.
const runRound = async (scene: Scene) => {
  const { director } = scene;
  const round = new AbortController();

  director.round = round;
  scene.signal = round.signal;
  if (director.dirty) {
    director.dirty = false;
    await recover(scene);
  }
  const request = director.request;
  const cycling = director.mode !== "picked";
  const dealt =
    cycling ?
      director.order[director.index % director.order.length]
    : undefined;
  const finish = request ?? dealt;

  director.request = undefined;
  if (!finish) {
    await new Promise<void>((resolve) => {
      director.wake = resolve;
    });
    return;
  }
  if (request) {
    fillBottle(scene, request);
    await sleep(700, round.signal);
  }
  // The close-up is for a chosen finish; the loop plays zoomed out.
  void zoomTo(scene, director.mode === "picked" ? 1 : 0);
  const next =
    cycling ?
      (director.order[(director.index + 1) % director.order.length] ?? finish)
    : finish;

  await paintRound(scene, finish, next);
  if (!request && cycling) director.index += 1;
};

const runLoop = async (scene: Scene) => {
  startTurning(scene);

  // Wait for the intro curtain (first visit) and the hand drawing in.
  const introSeen = document.documentElement.dataset.intro === "seen";

  await sleep(introSeen ? 2800 : 5000, scene.signal).catch(() => undefined);

  while (!scene.master.aborted) {
    try {
      await runRound(scene);
    } catch {
      // Cut short by a pick or a restart (or by unmounting, which ends the
      // loop before the flag matters).
      scene.director.dirty = true;
    }
  }
};

// The order a cycling mode deals: the classics as they always were, or the
// catalogue in a fresh shuffle.
const dealOrder = (cycle: Cycle): readonly Finish[] =>
  cycle === "classic" ? CLASSIC_FINISHES : shuffled(FINISHES);

// What the picker can ask of a running scene.
interface SceneControl {
  pick: (finish: Finish) => void;
  cycle: (cycle: Cycle) => void;
}

const control = (scene: Scene): SceneControl => ({
  pick: (finish) => {
    scene.director.mode = "picked";
    scene.director.request = finish;
    scene.director.round.abort();
    scene.director.wake();
  },
  cycle: (cycle) => {
    scene.director.mode = cycle;
    scene.director.request = undefined;
    scene.director.order = dealOrder(cycle);
    scene.director.index = 0;
    scene.director.round.abort();
    scene.director.wake();
  },
});

// Starts the loop on mount and stops it on unmount; hands back the controls
// for the picker. Reduced-motion visitors get the nails painted, without the
// loop or the turning, and a pick is painted straight on.
const startScene = (
  svg: SVGSVGElement,
): [SceneControl, () => void] | undefined => {
  const parts = findParts(svg);

  if (!parts) return;

  if (globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    paintAtOnce(parts, FIRST_FINISH);
    return [
      {
        pick: (finish) => {
          paintAtOnce(parts, finish);
          fillBottle(parts, finish);
        },
        cycle: () => {
          paintAtOnce(parts, FIRST_FINISH);
          fillBottle(parts, FIRST_FINISH);
        },
      },
      () => undefined,
    ];
  }

  const controller = new AbortController();
  const round = new AbortController();
  const scene: Scene = {
    ...parts,
    master: controller.signal,
    signal: round.signal,
    hand: { current: HAND },
    cursor: { at: BRUSH_IN_BOTTLE, now: BRUSH_IN_BOTTLE(HAND) },
    spread: { current: 0 },
    zoom: { current: 0, target: 0 },
    director: {
      // Every visit opens on the classic shades, in their original order.
      mode: "classic",
      request: undefined,
      order: dealOrder("classic"),
      index: 0,
      round,
      wake: () => undefined,
      dirty: false,
    },
  };

  runLoop(scene).catch(() => undefined);

  return [
    control(scene),
    () => {
      controller.abort();
      scene.director.round.abort();
      scene.director.wake();
      for (const animation of svg.getAnimations({ subtree: true })) {
        animation.cancel();
      }
    },
  ];
};

// The bottle's place in the drawing, as fractions of the viewBox, so an HTML
// button can sit over it.
const BOTTLE_AREA = {
  left: "84%",
  top: "76.8%",
  width: "12.8%",
  height: "22.8%",
};

const swatchButton =
  "relative flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl p-2 pt-3 transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose";

// The cycling options' tiles: the classic chrome for the original shades, and
// a nail in every colour at once for random.
const CLASSIC_SWATCH: Finish = {
  name: "classic",
  paint: "url(#hero-paint-chrome)",
};
const RANDOM_SWATCH: Finish = {
  name: "random",
  paint: "url(#hero-paint-holo)",
};

// A tile that hands the brush back to a self-running mode.
const CycleTile = ({
  swatch,
  label,
  onCycle,
}: Readonly<{ swatch: Finish; label: string; onCycle: () => void }>) => (
  <li>
    <button type="button" onClick={onCycle} className={swatchButton}>
      <span className="relative">
        <FinishSwatch finish={swatch} className="h-16 text-burgundy" />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pt-3 font-serif text-2xl font-medium text-burgundy-deep italic"
        >
          ?
        </span>
      </span>
      <span className="text-center text-[0.65rem] leading-tight font-semibold tracking-wide">
        {label}
      </span>
    </button>
  </li>
);

const PickerDialog = ({
  picker,
  dialogRef,
  onPick,
  onCycle,
}: Readonly<{
  picker: Picker;
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  onPick: (finish: Finish) => void;
  onCycle: (cycle: Cycle) => void;
}>) => {
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto max-h-[90dvh] w-[min(92vw,46rem)] overflow-y-auto rounded-[2rem] bg-pearl p-6 text-burgundy shadow-2xl shadow-burgundy-deep/50 backdrop:bg-burgundy-deep/70 backdrop:backdrop-blur-sm sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Not a heading: the dialog sits inside the hero, and a real <h2>
              here would precede the page's first section heading. */}
          <p
            id={titleId}
            className="font-serif text-3xl leading-tight italic sm:text-4xl"
          >
            {picker.title}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-plum">
            {picker.text}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={picker.close}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-2xl leading-none text-rose transition-colors hover:bg-rose hover:text-burgundy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
        >
          <span aria-hidden="true" className="-mt-0.5">
            ×
          </span>
        </button>
      </div>
      <ul className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        <CycleTile
          swatch={CLASSIC_SWATCH}
          label={picker.classic}
          onCycle={() => {
            onCycle("classic");
            close();
          }}
        />
        <CycleTile
          swatch={RANDOM_SWATCH}
          label={picker.random}
          onCycle={() => {
            onCycle("random");
            close();
          }}
        />
        {FINISHES.map((finish) => (
          <li key={finish.name}>
            <button
              type="button"
              onClick={() => {
                onPick(finish);
                close();
              }}
              className={swatchButton}
            >
              <FinishSwatch finish={finish} className="h-16 text-burgundy" />
              <span className="text-center text-[0.65rem] leading-tight font-semibold tracking-wide">
                {picker.names[finish.name] ?? finish.name}
              </span>
              {finish.isNew && (
                <span className="absolute top-1 right-1 rounded-full bg-rose px-1.5 py-0.5 text-[0.55rem] font-bold tracking-[0.15em] text-burgundy-deep uppercase">
                  {picker.newLabel}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
};

// The drawing, the bottle's button with its tooltip, and the picker dialog.
const HeroScene = ({
  className,
  picker,
}: Readonly<{ className?: string; picker: Picker }>) => {
  const sceneControl = useRef<SceneControl | undefined>(undefined);
  const dialogReference = useRef<HTMLDialogElement>(null);
  const tipId = useId();
  // The hint stays up until the bottle is first opened; after that it is an
  // ordinary tooltip on hover and focus.
  const [hinted, setHinted] = useState(false);
  // Stable, or React would restart the scene on every render.
  const mount = useCallback((svg: SVGSVGElement | null) => {
    if (!svg) return;
    const started = startScene(svg);

    if (!started) return;
    const [controls, stop] = started;

    sceneControl.current = controls;

    return () => {
      sceneControl.current = undefined;
      stop();
    };
  }, []);

  return (
    <div className={`relative ${className ?? ""}`}>
      <HeroDrawing svgRef={mount} />
      <div className="absolute" style={BOTTLE_AREA}>
        <button
          type="button"
          aria-label={picker.title}
          aria-describedby={tipId}
          onClick={() => {
            setHinted(true);
            dialogReference.current?.showModal();
          }}
          className="peer size-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose"
        />
        <span
          role="tooltip"
          id={tipId}
          className={`pointer-events-none absolute right-0 bottom-full mb-3 rounded-full bg-pearl px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-burgundy-deep shadow-lg shadow-burgundy-deep/40 transition-opacity duration-300 after:absolute after:top-full after:right-5 after:border-6 after:border-transparent after:border-t-pearl ${hinted ? "opacity-0 peer-hover:opacity-100 peer-focus-visible:opacity-100" : "rise"}`}
          style={hinted ? undefined : delay(1.9)}
        >
          {picker.hint}
        </span>
      </div>
      <PickerDialog
        picker={picker}
        dialogRef={dialogReference}
        onPick={(finish) => sceneControl.current?.pick(finish)}
        onCycle={(cycle) => sceneControl.current?.cycle(cycle)}
      />
    </div>
  );
};

const HeroDrawing = ({
  svgRef,
}: Readonly<{ svgRef: (svg: SVGSVGElement | null) => void }>) => (
  <svg
    ref={svgRef}
    viewBox="0 0 470 500"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="block w-full"
    aria-hidden="true"
  >
    <defs>
      <clipPath id="hero-arch-clip">
        <path d={ARCH} />
      </clipPath>
      <clipPath id="hero-nail-clip">
        <path d={NAIL} />
      </clipPath>
      <clipPath id="hero-bottle-clip">
        <rect x="395" y="400" width="60" height="98" rx="13" />
      </clipPath>
      {/* Each digit's silhouette, and the masks that hide behind the nails
          and the digits nearer than a given one: mask n is for the nth
          nearest digit, and the last is for the hand itself. */}
      {HAND.layers.map((layer) => (
        <path key={layer.key} id={`hero-${layer.key}`} d={layer.shape} />
      ))}
      {HAND.nails.map((nail, index) => (
        <path
          key={index}
          id={`hero-nail-${String(index)}`}
          d={placePath(NAIL, nail)}
        />
      ))}
      {Array.from({ length: HAND.layers.length + 1 }, (_, count) => (
        <mask
          key={count}
          id={`hero-behind-${String(count)}`}
          maskUnits="userSpaceOnUse"
          {...MASK_AREA}
        >
          <rect {...MASK_AREA} fill="white" stroke="none" />
          {/* A finger's outline stops at its own nail and at the nails of
              nearer fingers; a farther finger's nail lies behind it. */}
          {HAND.nails.slice(0, count + 1).map((_, index) => (
            <use
              key={index}
              href={`#hero-nail-${String(index)}`}
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          ))}
          {HAND.layers.slice(0, count).map((layer) => (
            <use
              key={layer.key}
              href={`#hero-${layer.key}`}
              fill="black"
              stroke="none"
            />
          ))}
        </mask>
      ))}
      {/* The same without a digit's own nail, for the nails themselves and
          for the brush painting them: both are hidden where a nearer finger
          or a nearer nail covers them. */}
      {HAND.layers.slice(1).map((_, index) => (
        <mask
          key={index}
          id={`hero-nail-behind-${String(index + 1)}`}
          maskUnits="userSpaceOnUse"
          {...MASK_AREA}
        >
          <rect {...MASK_AREA} fill="white" stroke="none" />
          {HAND.nails.slice(0, index + 1).map((_, nearer) => (
            <use
              key={nearer}
              href={`#hero-nail-${String(nearer)}`}
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          ))}
          {HAND.layers.slice(0, index + 1).map((layer) => (
            <use
              key={layer.key}
              href={`#hero-${layer.key}`}
              fill="black"
              stroke="none"
            />
          ))}
        </mask>
      ))}
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
      <HeroFinishDefs />
    </defs>

    <path
      d={ARCH}
      className="fill-burgundy-deep/60 stroke-rose/25"
      strokeWidth="1.5"
    />
    <path d={ARCH_INNER} className="stroke-rose/15" strokeWidth="1" />

    <g clipPath="url(#hero-arch-clip)">
      <rect width="400" height="500" fill="url(#hero-glow)" stroke="none" />
      <g>
        <g mask={`url(#hero-behind-${String(HAND.layers.length)})`}>
          {HAND.body.map((side, index) => (
            <path
              key={index}
              data-body
              d={side}
              pathLength={1}
              strokeWidth="1.5"
              className="nail-draw"
              style={{ ...delay(0), animationDuration: "1.6s" }}
            />
          ))}
          <path
            data-web
            d={HAND.details}
            pathLength={1}
            strokeWidth="1.2"
            opacity="0.7"
            className="nail-draw"
            style={delay(1.3)}
          />
        </g>
        {HAND.layers
          .map((layer, index) => (
            <g
              key={layer.key}
              data-layer={layer.key}
              mask={`url(#hero-behind-${String(index)})`}
            >
              <path
                data-outline
                d={layer.outline}
                pathLength={1}
                strokeWidth="1.5"
                className="nail-draw"
                style={{
                  ...delay(0.5 + (HAND.layers.length - index) * 0.15),
                  animationDuration: "1.2s",
                }}
              />
              <path
                data-creases
                d={layer.details}
                pathLength={1}
                strokeWidth="0.9"
                opacity="0.4"
                className="nail-draw"
                style={{ ...delay(1.9), animationDuration: "0.8s" }}
              />
            </g>
          ))
          .toReversed()}
        {HAND.nails.map((nail, index) => (
          <g
            key={index}
            data-nail={index}
            mask={index ? `url(#hero-nail-behind-${String(index)})` : undefined}
          >
            <g
              data-frame
              transform={nailTransform(nail)}
              clipPath="url(#hero-nail-clip)"
              stroke="none"
            >
              <rect
                data-base
                x="-30"
                y="-75"
                width="60"
                height="140"
                className="fill-pearl/15"
              />
              <use data-decor style={{ opacity: 0 }} />
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
              data-rim
              d={placePath(NAIL, nail)}
              pathLength={1}
              strokeWidth="1.2"
              className="nail-draw"
              style={delay(1.5 + index * 0.1)}
            />
            <path
              data-cuticle
              d={placePath(CUTICLE, nail)}
              strokeWidth="0.7"
              opacity="0.5"
            />
            <path
              data-gloss
              d={placePath(GLOSS, nail)}
              strokeWidth="1.4"
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
    <g data-pop-cover>
      <path
        data-pop
        d={sparklePath(0, 0, 10)}
        stroke="none"
        className="fill-rose-soft"
        style={{ opacity: 0 }}
      />
    </g>

    {/* The brush: bristles tip at the origin, handle (the bottle cap) above. */}
    <g data-brush-cover>
      <g data-brush style={{ transform: BRUSH_HOME }}>
        <path
          data-bristles
          d={BRISTLES_GATHERED.head}
          stroke="none"
          style={{ fill: FIRST_SHADE }}
        />
        <path
          data-hairs
          d={BRISTLES_GATHERED.hairs}
          strokeWidth="0.8"
          strokeLinecap="round"
          className="stroke-white/25"
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
    </g>

    {/* The bottle, drawn over the brush so it hides the bristles when capped.
        It is tall enough to show the next finish's design at full size. */}
    <g className="rise" style={delay(0.9)}>
      <rect
        x="416"
        y="384"
        width="18"
        height="18"
        rx="3"
        strokeWidth="1.5"
        className="fill-rose-soft/20"
      />
      <rect
        data-liquid
        x="395"
        y="400"
        width="60"
        height="98"
        rx="13"
        strokeWidth="1.5"
        style={{ fill: FIRST_SHADE, transition: "fill 0.8s ease" }}
      />
      <rect
        data-liquid-gradient
        x="395"
        y="400"
        width="60"
        height="98"
        rx="13"
        strokeWidth="1.5"
        fill="url(#hero-paint-chrome)"
        style={{ opacity: 0, transition: "opacity 0.8s ease" }}
      />
      <g clipPath="url(#hero-bottle-clip)" stroke="none">
        <use
          data-liquid-decor
          href={
            FIRST_FINISH.decor ? `#hero-decor-${FIRST_FINISH.decor}` : undefined
          }
          transform="translate(425 450)"
          style={{
            opacity: FIRST_FINISH.decor ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        />
        <use
          data-liquid-decor
          transform="translate(425 450)"
          style={{ opacity: 0, transition: "opacity 0.8s ease" }}
        />
      </g>
      <rect x="395" y="400" width="60" height="98" rx="13" strokeWidth="1.5" />
      <path d="M405 416V482" strokeWidth="3" className="stroke-white/45" />
      <path
        d={sparklePath(443, 414, 6)}
        stroke="none"
        className="fill-white/70"
      />
    </g>
  </svg>
);

export default HeroScene;
