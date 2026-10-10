"use client";

import { memo, useEffect, useRef } from "react";
import { ElementDefs, ElementView } from "@/components/builder/elements";
import type {
  Finger,
  HandState,
  Paint,
  Side,
} from "@/components/builder/state";
import { FINGERS } from "@/components/builder/state";
import { BUILDER_HAND, FRAME, WRIST_CREASE } from "@/components/builder-hand";
import {
  nailPoint,
  type NailPose,
  nailTransform,
  placePath,
} from "@/components/hand-model";
import { delay } from "@/components/nail-art";
import { FinishGradients } from "@/components/nail-finishes";
import { nailOutline, tipY } from "@/components/nail-form";

// One hand as a complete SVG: the builder pose drawn in the hero's outline
// style, with the chosen nail form and each nail's design, on a bare
// background (no arch or sparkles, unlike the hero).
// Every colour is a literal so the markup can be serialised for the
// download. The left hand is the same drawing mirrored, with each nail's
// decoration mirrored back so designs appear as they were placed.

// The same values as globals.css.
const PALETTE = {
  pearl: "#fbf5f3",
  rose: "#cf8e80",
  roseSoft: "#ebc9c1",
  burgundyDeep: "#2a0510",
  white: "#ffffff",
} as const;

// Strokes a quarter lighter than the hero's.
const LINE = 0.75;

const MASK_AREA = { x: -60, y: -60, width: 520, height: 740 };

const CUTICLE = "M-17 38C-17 24 17 24 17 38";

// The glint near the free edge, following the tip up as the nail grows.
const gloss = (tip: number) =>
  `M-11 ${String(tip + 56)}C-11 ${String(tip + 38)}-6 ${String(tip + 26)} 0 ${String(tip + 18)}`;

// Behind the nail: paints the whole area the longest nail can clip.
const BASE = { x: -30, y: -130, width: 60, height: 195 };

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// The frame as shown: the empty band above the fingertips is cropped off,
// with just enough room for the longest nails and their halos.
const CROP_TOP = 120;
const FULL_BOX: ViewBox = {
  x: 0,
  y: CROP_TOP,
  width: FRAME.width,
  height: FRAME.height - CROP_TOP,
};

const FULL_VIEW = `${String(FULL_BOX.x)} ${String(FULL_BOX.y)} ${String(FULL_BOX.width)} ${String(FULL_BOX.height)}`;

const paintFill = (paint: Paint, prefix: string) =>
  paint.kind === "solid" ? paint.hex : `url(#${prefix}-paint-${paint.id})`;

// The nail's screen bounding box, padded, for zooming in on it.
const nailBox = (pose: NailPose, tip: number, side: Side): ViewBox => {
  const corners = [
    nailPoint(pose, -24, tip),
    nailPoint(pose, 24, tip),
    nailPoint(pose, -24, 64),
    nailPoint(pose, 24, 64),
  ].map(({ x, y }) => ({ x: side === "left" ? FRAME.width - x : x, y }));
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = (maxX - minX) * 0.3;
  const padY = (maxY - minY) * 0.3;

  return {
    x: minX - padX,
    y: minY - padY,
    width: maxX - minX + 2 * padX,
    height: maxY - minY + 2 * padY,
  };
};

const viewBoxString = ({ x, y, width, height }: ViewBox) =>
  [x, y, width, height].map((value) => value.toFixed(1)).join(" ");

const parseViewBox = (value: string | null): ViewBox => {
  const [x = 0, y = 0, width = FRAME.width, height = FRAME.height] = (
    value ?? ""
  )
    .split(/\s+/)
    .map(Number);

  return { x, y, width, height };
};

const inOut = (u: number) =>
  u < 0.5 ? 4 * u * u * u : 1 - (2 - 2 * u) ** 3 / 2;

const ZOOM_DURATION = 450;

const reducedMotion = () =>
  globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The slot the SVG fills, as width and height in pixels.
const slotOf = (svg: SVGSVGElement) => {
  const slot = svg.parentElement?.getBoundingClientRect();

  return slot && slot.width > 0 && slot.height > 0 ?
      { width: slot.width, height: slot.height }
    : undefined;
};

// A zoom target grown to the slot's aspect ratio about its centre, so the
// whole nail shows.
const fitFocus = (box: ViewBox, ratio: number): ViewBox => {
  if (box.height / box.width < ratio) {
    const height = box.width * ratio;

    return { ...box, y: box.y - (height - box.height) / 2, height };
  }
  const width = box.height / ratio;

  return { ...box, x: box.x - (width - box.width) / 2, width };
};

// Frame units from the top of the shown crop to just below the thumb's
// nail: what the full view must always show.
const NAIL_BAND = 275;

// The full hand at the slot's aspect ratio: as wide as the slot, anchored
// at the top with the forearm cropped, unless that would push a nail out of
// view, in which case the hand shrinks (centred) until the nails fit.
const fitFull = (ratio: number): ViewBox => {
  const height = FULL_BOX.width * ratio;

  if (height >= NAIL_BAND) return { ...FULL_BOX, height };
  const width = NAIL_BAND / ratio;

  return {
    x: FULL_BOX.x - (width - FULL_BOX.width) / 2,
    y: FULL_BOX.y,
    width,
    height: NAIL_BAND,
  };
};

// How the viewBox relates to the slot: "height" leaves the boxes as they
// are (the SVG scales to its height); "width" shapes every box to the
// slot's aspect ratio, so the SVG fills the slot exactly.
type Fit = "height" | "width";

const fitBox = (
  svg: SVGSVGElement,
  box: ViewBox,
  focused: boolean,
  fit: Fit,
) => {
  const slot = fit === "width" ? slotOf(svg) : undefined;

  if (!slot) return box;
  const ratio = slot.height / slot.width;

  return focused ? fitFocus(box, ratio) : fitFull(ratio);
};

// Glides the viewBox to the target; with reduced motion it jumps. In the
// width fit, the box also follows the slot as it resizes.
const useZoom = (
  svgReference: React.RefObject<SVGSVGElement | null>,
  target: ViewBox,
  focused: boolean,
  fit: Fit,
) => {
  const { x, y, width, height } = target;

  useEffect(() => {
    const svg = svgReference.current;

    if (!svg) return;
    const box = { x, y, width, height };
    const to = fitBox(svg, box, focused, fit);
    const from = parseViewBox(svg.getAttribute("viewBox"));
    const handle = { frame: 0, settled: false };

    if (reducedMotion()) {
      svg.setAttribute("viewBox", viewBoxString(to));
      handle.settled = true;
    } else {
      const start = performance.now();
      const step = (now: number) => {
        const u = Math.min((now - start) / ZOOM_DURATION, 1);
        const eased = inOut(u);
        const mix = (a: number, b: number) => a + (b - a) * eased;

        svg.setAttribute(
          "viewBox",
          viewBoxString({
            x: mix(from.x, to.x),
            y: mix(from.y, to.y),
            width: mix(from.width, to.width),
            height: mix(from.height, to.height),
          }),
        );
        if (u < 1) handle.frame = requestAnimationFrame(step);
        else handle.settled = true;
      };

      handle.frame = requestAnimationFrame(step);
    }

    // Once settled, a resized slot (the sheet folding) re-fits the box.
    const parent = svg.parentElement;
    const observer =
      fit === "width" && parent ?
        new ResizeObserver(() => {
          if (!handle.settled) return;
          svg.setAttribute(
            "viewBox",
            viewBoxString(fitBox(svg, box, focused, fit)),
          );
        })
      : undefined;

    if (observer && parent) observer.observe(parent);

    return () => {
      cancelAnimationFrame(handle.frame);
      observer?.disconnect();
    };
  }, [svgReference, x, y, width, height, focused, fit]);
};

interface HandDrawingProperties {
  side: Side;
  hand: HandState;
  // Unique id prefix for this SVG's defs.
  prefix: string;
  className?: string;
  // Nails become buttons when labels and a handler are given.
  nailLabels?: readonly string[];
  onNail?: (side: Side, finger: Finger) => void;
  activeFinger?: Finger;
  // The nail to zoom in on, if any.
  focus?: Finger;
  dimmed?: boolean;
  // Draw the outline in on first paint.
  entrance?: boolean;
  // How the SVG fills its slot: by height (desktop), or shaped to the
  // slot with the top anchored and the forearm cropped (phones), so the
  // scale holds steady as the slot's height changes.
  fit?: Fit;
  svgRef?: React.Ref<SVGSVGElement>;
}

const HandDrawing = ({
  side,
  hand,
  prefix,
  className,
  nailLabels,
  onNail,
  activeFinger,
  focus,
  dimmed = false,
  entrance = false,
  fit = "height",
  svgRef,
}: Readonly<HandDrawingProperties>) => {
  const svgReference = useRef<SVGSVGElement>(null);
  // The zoom needs its own handle on the SVG; the caller's ref is fed too.
  const attach = (node: SVGSVGElement | null) => {
    svgReference.current = node;
    if (typeof svgRef === "function") svgRef(node);
    else if (svgRef) svgRef.current = node;
  };
  const outline = nailOutline(hand.form);
  const tip = tipY(hand.form.length);
  const focusPose = focus === undefined ? undefined : BUILDER_HAND.nails[focus];

  useZoom(
    svgReference,
    focusPose ? nailBox(focusPose, tip, side) : FULL_BOX,
    focusPose !== undefined,
    fit,
  );

  const draw = (seconds: number, duration?: string) =>
    entrance ?
      {
        className: "nail-draw",
        pathLength: 1,
        style: { ...delay(seconds), animationDuration: duration },
      }
    : {};

  const interactive = onNail !== undefined && nailLabels !== undefined;

  return (
    <svg
      ref={attach}
      viewBox={FULL_VIEW}
      preserveAspectRatio={fit === "width" ? "xMidYMin meet" : undefined}
      fill="none"
      stroke={PALETTE.pearl}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={interactive ? undefined : true}
      role={interactive ? "group" : undefined}
      data-hand={side}
    >
      <defs>
        <clipPath id={`${prefix}-nail-clip`}>
          <path d={outline} />
        </clipPath>
        {BUILDER_HAND.nails.map((pose, index) => (
          <path
            key={index}
            id={`${prefix}-nail-${String(index)}`}
            d={placePath(outline, pose)}
          />
        ))}
        {/* Each finger's outline stops at its own nail; the fingers are
            spread, so nothing else hides anything. */}
        {BUILDER_HAND.nails.map((_, index) => (
          <mask
            key={index}
            id={`${prefix}-behind-${String(index)}`}
            maskUnits="userSpaceOnUse"
            {...MASK_AREA}
          >
            <rect {...MASK_AREA} fill="white" stroke="none" />
            <use
              href={`#${prefix}-nail-${String(index)}`}
              fill="black"
              stroke="black"
              strokeWidth="1"
            />
          </mask>
        ))}
        <FinishGradients idPrefix={prefix} />
        <ElementDefs prefix={prefix} />
      </defs>

      <g>
        <g
          transform={
            side === "left" ?
              `scale(-1 1) translate(${String(-FRAME.width)} 0)`
            : undefined
          }
          opacity={dimmed ? 0.35 : 1}
          style={{ transition: "opacity 450ms" }}
        >
          <g>
            {BUILDER_HAND.body.map((path, index) => (
              <path
                key={index}
                d={path}
                strokeWidth={1.5 * LINE}
                {...draw(0, "1.6s")}
              />
            ))}
            <path
              d={BUILDER_HAND.details}
              strokeWidth={1.2 * LINE}
              opacity="0.7"
              {...draw(1.3)}
            />
            <path
              d={WRIST_CREASE}
              strokeWidth={0.9 * LINE}
              opacity="0.4"
              {...draw(1.9, "0.8s")}
            />
          </g>
          {BUILDER_HAND.layers.map((layer, index) => (
            <g key={layer.key} mask={`url(#${prefix}-behind-${String(index)})`}>
              <path
                d={layer.outline}
                strokeWidth={1.5 * LINE}
                {...draw(0.5 + (5 - index) * 0.15, "1.2s")}
              />
              <path
                d={layer.details}
                strokeWidth={0.9 * LINE}
                opacity="0.4"
                {...draw(1.9, "0.8s")}
              />
            </g>
          ))}
          {FINGERS.map((finger) => {
            const pose = BUILDER_HAND.nails[finger];
            const design = hand.nails[finger];

            if (!pose || !design) return undefined;
            const rim = placePath(outline, pose);
            const active = activeFinger === finger;
            const nail = (
              <>
                <path
                  data-halo
                  d={rim}
                  stroke={PALETTE.rose}
                  strokeWidth="7"
                  strokeOpacity="0.55"
                  className={`transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                />
                <g
                  transform={nailTransform(pose)}
                  clipPath={`url(#${prefix}-nail-clip)`}
                  stroke="none"
                >
                  <g transform={side === "left" ? "scale(-1 1)" : undefined}>
                    <rect {...BASE} fill={paintFill(design.paint, prefix)} />
                    {design.elements.map((element) => (
                      <ElementView
                        key={element.id}
                        element={element}
                        tipY={tip}
                        prefix={prefix}
                      />
                    ))}
                  </g>
                </g>
                <path
                  d={rim}
                  strokeWidth={1.2 * LINE}
                  {...draw(1.5 + finger * 0.1)}
                />
                <path
                  d={placePath(CUTICLE, pose)}
                  strokeWidth={0.7 * LINE}
                  opacity="0.5"
                />
                <path
                  d={placePath(gloss(tip), pose)}
                  strokeWidth="1.4"
                  stroke={PALETTE.white}
                  opacity="0.15"
                />
              </>
            );

            return interactive ?
                <g
                  key={finger}
                  role="button"
                  tabIndex={0}
                  aria-label={nailLabels[finger]}
                  aria-pressed={active}
                  data-finger={finger}
                  className="group cursor-pointer outline-none"
                  onClick={() => {
                    onNail(side, finger);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNail(side, finger);
                    }
                  }}
                >
                  {nail}
                </g>
              : <g key={finger} data-finger={finger}>
                  {nail}
                </g>;
          })}
        </g>
      </g>
    </svg>
  );
};

// Re-rendering the hand is the costly part of any update, so it only
// happens when its own inputs change.
const MemoHandDrawing = memo(HandDrawing);

export { BASE, FULL_VIEW, MemoHandDrawing as HandDrawing, paintFill, PALETTE };
