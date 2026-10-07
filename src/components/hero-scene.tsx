"use client";

import {
  buildHand,
  HAND,
  type Hand,
  nailPoint,
  nailTransform,
  placePath,
  VIEW,
} from "@/components/hero-hand";
import {
  CUTICLE,
  delay,
  GLOSS,
  NAIL,
  sparklePath,
} from "@/components/nail-art";
import {
  type Finish,
  FINISHES,
  HeroFinishDefs,
  isGradient,
} from "@/components/nail-finishes";

// A manicure on a loop: a hand held up in the arch, drawn in outline only,
// and the brush (which doubles as the bottle cap) lifts out, paints each nail
// from cuticle to tip along that nail's own direction, returns to the bottle
// and the next round brings the next shade. Server-rendered as bare nails
// with the bottle capped; the loop is driven by the Web Animations API once
// mounted. The finishes it cycles through live in nail-finishes.tsx.

const FIRST_FINISH: Finish = FINISHES[0] ?? {
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

const BRUSH_IN_BOTTLE = atBottle(425, 490, 0);
const BRUSH_ABOVE_BOTTLE = atBottle(425, 382, -12);
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
}

interface Scene extends SceneParts {
  signal: AbortSignal;
  // The hand as currently projected, updated every frame while the loop runs.
  hand: { current: Hand };
  // Where the brush was last sent, so the next move can start from there.
  cursor: { at: PoseAt };
  // How far the bristles are currently splayed, 0 gathered to 1 pressed.
  spread: { current: number };
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
    if (scene.signal.aborted) return;
    const yaw =
      VIEW.yaw +
      TURN.amplitude * Math.sin(((now - start) / TURN.period) * 2 * Math.PI);

    scene.hand.current = buildHand(yaw);
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

    scene.brush.style.transform = pose({
      x: mix(a.x, b.x),
      y: mix(a.y, b.y),
      angle: mix(a.angle, b.angle),
    });
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
const fillBottle = (scene: Scene, finish: Finish) => {
  if (isGradient(finish.paint)) {
    scene.liquidGradient.setAttribute("fill", finish.paint);
    scene.liquidGradient.style.opacity = "1";
  } else {
    scene.liquid.style.fill = finish.paint;
    scene.liquidGradient.style.opacity = "0";
  }
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

const runLoop = async (scene: Scene) => {
  startTurning(scene);
  const order = shuffled(FINISHES);

  // The bottle is server-rendered with the first catalogue shade; it settles
  // on this visit's first pick while the hand draws in.
  fillBottle(scene, order[0] ?? FIRST_FINISH);

  // Wait for the intro curtain (first visit) and the hand drawing in.
  const introSeen = document.documentElement.dataset.intro === "seen";

  await sleep(introSeen ? 2800 : 5000, scene.signal);
  const state = { round: 0 };

  while (!scene.signal.aborted) {
    const finish = order[state.round % order.length] ?? FIRST_FINISH;
    const next = order[(state.round + 1) % order.length] ?? FIRST_FINISH;

    await paintRound(scene, finish, next);
    state.round += 1;
  }
};

// Ref callback with cleanup (React 19): starts the loop on mount, stops it on
// unmount. Reduced-motion visitors get the nails painted, without the loop
// or the turning.
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
  const scene: Scene = {
    ...parts,
    signal: controller.signal,
    hand: { current: HAND },
    cursor: { at: BRUSH_IN_BOTTLE },
    spread: { current: 0 },
  };

  runLoop(scene).catch(() => undefined);

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
        fill="url(#hero-paint-chrome)"
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
