"use client";

import { useEffect, useRef, useState } from "react";
import {
  definitionOf,
  ElementDefs,
  ElementView,
} from "@/components/builder/elements";
import { BASE, paintFill, PALETTE } from "@/components/builder/hand-drawing";
import type { NailDesign, NailElement } from "@/components/builder/state";
import { FinishGradients } from "@/components/nail-finishes";
import type { NailForm } from "@/components/nail-form";
import { nailOutline, tipY } from "@/components/nail-form";

// The nail face-on, in its own coordinates, for placing elements: drag to
// move, handles to rotate and scale, keyboard for all of it. Also draws a
// bare nail for the finger strip and the export tiles.

const VIEW = "-40 -140 80 220";

// How far off the nail an element's centre may go.
const SLACK = 10;

interface NailViewProperties {
  design: NailDesign;
  form: NailForm;
  // Unique to this SVG.
  prefix: string;
  // The id prefix of shared gradient defs elsewhere in the document; left
  // out, the SVG carries its own (for the export).
  defs?: string;
  className?: string;
  // Outline the nail in plum instead of pearl, so a pale pattern reads
  // against a pale background (the catalogue tiles).
  outlined?: boolean;
  // A tighter view than the default, which has room for the longest nail.
  viewBox?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  children?: React.ReactNode;
}

// A nail with its paint and elements, no handles: the editor's base, the
// finger strip's tiles and the export's.
const NailView = ({
  design,
  form,
  prefix,
  defs,
  className,
  outlined = false,
  viewBox = VIEW,
  svgRef,
  children,
}: Readonly<NailViewProperties>) => {
  const outline = nailOutline(form);
  const tip = tipY(form.length);
  const shared = defs ?? prefix;

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke={PALETTE.pearl}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-nail-view
    >
      <defs>
        <clipPath id={`${prefix}-clip`}>
          <path d={outline} />
        </clipPath>
        {defs === undefined && (
          <>
            <FinishGradients idPrefix={prefix} />
            <ElementDefs prefix={prefix} />
          </>
        )}
      </defs>
      <g clipPath={`url(#${prefix}-clip)`} stroke="none">
        <rect {...BASE} fill={paintFill(design.paint, shared)} />
        {design.elements.map((element) => (
          <ElementView
            key={element.id}
            element={element}
            tipY={tip}
            prefix={prefix}
            defs={shared}
          />
        ))}
      </g>
      {outlined ?
        <path d={outline} stroke="#80525b" strokeWidth="1.5" />
      : <path d={outline} strokeWidth="1" strokeOpacity="0.8" />}
      <path
        d={`M-11 ${String(tip + 56)}C-11 ${String(tip + 38)}-6 ${String(tip + 26)} 0 ${String(tip + 18)}`}
        strokeWidth="1.6"
        stroke={PALETTE.white}
        opacity="0.18"
      />
      {children}
    </svg>
  );
};

interface Point {
  x: number;
  y: number;
}

// Pointer position in the SVG's user units.
const localPoint = (
  svg: SVGSVGElement,
  event: { clientX: number; clientY: number },
): Point => {
  const matrix = svg.getScreenCTM()?.inverse();
  const point = new DOMPoint(event.clientX, event.clientY);
  const local = matrix ? point.matrixTransform(matrix) : point;

  return { x: local.x, y: local.y };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const SCALE_RANGE = { min: 0.4, max: 3 };

type Patch = Partial<Omit<NailElement, "id">>;

interface Drag {
  mode: "move" | "rotate" | "scale";
  pointerId: number;
  // The element as it was when the drag started, and the pointer's start.
  element: NailElement;
  start: Point;
  // Pinch: the second pointer, its start and the start distance/angle.
  second?: { pointerId: number; point: Point };
  startDistance?: number;
  startAngle?: number;
}

interface NailEditorProperties extends Omit<
  NailViewProperties,
  "children" | "svgRef" | "viewBox"
> {
  selected: string | undefined;
  onSelect: (id: string | undefined) => void;
  onChange: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
  elementLabel: (element: NailElement) => string;
  deleteLabel: string;
  hint: string;
}

const degrees = (radians: number) => (radians * 180) / Math.PI;

// The handles' hit radius, in nail units: a comfortable thumb target.
const HIT = 12;

// A red ×, with a hit circle far larger than the drawn one, that removes
// the selected element.
const DeleteHandle = ({
  cx,
  cy,
  label,
  onDelete,
}: Readonly<{
  cx: number;
  cy: number;
  label: string;
  onDelete: () => void;
}>) => (
  <g
    role="button"
    tabIndex={0}
    aria-label={label}
    className="cursor-pointer outline-none"
    onPointerDown={(event) => {
      event.stopPropagation();
    }}
    onClick={(event) => {
      event.stopPropagation();
      onDelete();
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onDelete();
      }
    }}
  >
    <circle cx={cx} cy={cy} r={HIT} fill="transparent" stroke="none" />
    <circle
      cx={cx}
      cy={cy}
      r="5.2"
      fill="#d8323c"
      stroke={PALETTE.pearl}
      strokeWidth="0.8"
    />
    <path
      d={`M${(cx - 2.2).toFixed(1)} ${(cy - 2.2).toFixed(1)}l4.4 4.4M${(cx + 2.2).toFixed(1)} ${(cy - 2.2).toFixed(1)}l-4.4 4.4`}
      stroke={PALETTE.pearl}
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </g>
);

// Rhinestones come in fixed sizes; everything else scales.
const resizable = (element: NailElement) =>
  element.kind !== "pattern" && element.kind !== "stone";

const NailEditor = ({
  design,
  form,
  prefix,
  defs,
  className,
  selected,
  onSelect,
  onChange,
  onDelete,
  elementLabel,
  deleteLabel,
  hint,
}: Readonly<NailEditorProperties>) => {
  const svgReference = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | undefined>(undefined);
  // A drag in progress is drawn from here, batched per frame, and only
  // committed to the design when the pointer lifts: one undo step, and the
  // rest of the page is left alone meanwhile.
  const pending = useRef<{ id: string; patch: Patch } | undefined>(undefined);
  const [live, setLive] = useState<{ id: string; patch: Patch } | undefined>(
    undefined,
  );
  const frame = useRef(0);
  const [hintId] = useState(() => `${prefix}-hint`);
  const tip = tipY(form.length);
  // The view hugs this nail's length, with room above for the handles of
  // an element at the tip, so a short nail is drawn as large as a long one.
  const viewTop = tip - 30;
  const viewHeight = 80 - viewTop;
  const viewBox = `-40 ${String(viewTop)} 80 ${String(viewHeight)}`;
  const bounds = {
    minX: -24 - SLACK,
    maxX: 24 + SLACK,
    minY: tip - SLACK,
    maxY: 64 + SLACK,
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  const show = () => {
    const update = pending.current;

    if (update) setLive({ id: update.id, patch: { ...update.patch } });
  };

  const queue = (id: string, patch: Patch) => {
    pending.current = { id, patch: { ...pending.current?.patch, ...patch } };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(show);
  };

  const commit = () => {
    const update = pending.current;

    pending.current = undefined;
    cancelAnimationFrame(frame.current);
    setLive(undefined);
    if (update) onChange(update.id, update.patch);
  };

  const beginDrag = (
    event: React.PointerEvent<SVGElement>,
    element: NailElement,
    mode: Drag["mode"],
  ) => {
    const svg = svgReference.current;

    if (!svg) return;
    const current = drag.current;
    const point = localPoint(svg, event);

    // A second finger on the selected element starts a pinch.
    if (current?.element.id === element.id && !current.second) {
      const a = current.start;

      current.second = { pointerId: event.pointerId, point };
      current.startDistance = Math.hypot(point.x - a.x, point.y - a.y);
      current.startAngle = Math.atan2(point.y - a.y, point.x - a.x);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(element.id);
    drag.current = { mode, pointerId: event.pointerId, element, start: point };
  };

  const moveDrag = (event: React.PointerEvent<SVGElement>) => {
    const svg = svgReference.current;
    const current = drag.current;

    if (!svg || !current) return;
    const point = localPoint(svg, event);
    const element = current.element;

    if (current.second) {
      // Pinch: the two pointers' distance scales, their angle rotates.
      const a = event.pointerId === current.pointerId ? point : current.start;
      const b =
        event.pointerId === current.second.pointerId ?
          point
        : current.second.point;

      if (event.pointerId === current.pointerId) current.start = point;
      else current.second.point = point;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const scale = clamp(
        element.scale * (distance / (current.startDistance ?? distance)),
        SCALE_RANGE.min,
        SCALE_RANGE.max,
      );
      const rotation =
        element.rotation + degrees(angle - (current.startAngle ?? angle));

      queue(
        element.id,
        resizable(element) ? { scale, rotation } : { rotation },
      );
      return;
    }
    if (event.pointerId !== current.pointerId) return;
    switch (current.mode) {
      case "move": {
        queue(element.id, {
          x: clamp(
            element.x + point.x - current.start.x,
            bounds.minX,
            bounds.maxX,
          ),
          y: clamp(
            element.y + point.y - current.start.y,
            bounds.minY,
            bounds.maxY,
          ),
        });
        break;
      }
      case "rotate": {
        const angle =
          degrees(Math.atan2(point.y - element.y, point.x - element.x)) + 90;

        queue(element.id, { rotation: Math.round(angle) });
        break;
      }
      case "scale": {
        const definition = definitionOf(element.kind, element.variant);
        const half =
          Math.hypot(definition?.width ?? 16, definition?.height ?? 16) / 2;
        const reach = Math.hypot(point.x - element.x, point.y - element.y);

        queue(element.id, {
          scale: clamp(reach / half, SCALE_RANGE.min, SCALE_RANGE.max),
        });
        break;
      }
    }
  };

  const endDrag = (event: React.PointerEvent<SVGElement>) => {
    const current = drag.current;

    if (!current) return;
    if (current.second?.pointerId === event.pointerId) {
      current.second = undefined;
      return;
    }
    if (event.pointerId === current.pointerId) {
      drag.current = undefined;
      commit();
    }
  };

  const keyboard = (
    event: React.KeyboardEvent<SVGElement>,
    element: NailElement,
  ) => {
    const step = event.shiftKey ? 5 : 1;
    const nudge = (dx: number, dy: number) => {
      onChange(element.id, {
        x: clamp(element.x + dx, bounds.minX, bounds.maxX),
        y: clamp(element.y + dy, bounds.minY, bounds.maxY),
      });
    };
    const movable = element.kind !== "pattern";

    switch (event.key) {
      case "ArrowLeft": {
        if (movable) nudge(-step, 0);
        break;
      }
      case "ArrowRight": {
        if (movable) nudge(step, 0);
        break;
      }
      case "ArrowUp": {
        if (movable) nudge(0, -step);
        break;
      }
      case "ArrowDown": {
        if (movable) nudge(0, step);
        break;
      }
      case "[": {
        if (movable) onChange(element.id, { rotation: element.rotation - 15 });
        break;
      }
      case "]": {
        if (movable) onChange(element.id, { rotation: element.rotation + 15 });
        break;
      }
      case "+":
      case "=": {
        if (resizable(element))
          onChange(element.id, {
            scale: clamp(element.scale * 1.1, SCALE_RANGE.min, SCALE_RANGE.max),
          });
        break;
      }
      case "-": {
        if (resizable(element))
          onChange(element.id, {
            scale: clamp(element.scale / 1.1, SCALE_RANGE.min, SCALE_RANGE.max),
          });
        break;
      }
      case "Delete":
      case "Backspace": {
        onDelete(element.id);
        break;
      }
      default: {
        return;
      }
    }
    event.preventDefault();
  };

  // The design as drawn: the store's, with the drag in progress laid over.
  const shown =
    live ?
      {
        ...design,
        elements: design.elements.map((element) =>
          element.id === live.id ? { ...element, ...live.patch } : element,
        ),
      }
    : design;
  const selectedElement = shown.elements.find(
    (element) => element.id === selected,
  );
  const definition =
    selectedElement &&
    definitionOf(selectedElement.kind, selectedElement.variant);

  return (
    // Pressing anything that is not an element or a handle clears the
    // selection; the handles stop the event before it gets here.

    <div
      className={className}
      style={{ aspectRatio: `80 / ${String(viewHeight)}` }}
      onPointerDown={(event) => {
        if (
          event.target instanceof Element &&
          !event.target.closest("[role='button']")
        ) {
          onSelect(undefined);
        }
      }}
    >
      <NailView
        design={shown}
        form={form}
        prefix={prefix}
        defs={defs}
        viewBox={viewBox}
        svgRef={svgReference}
        className="h-full w-full touch-none select-none"
      >
        {/* Hit areas and handles, over the drawing. Elements are buttons in
            the tab order; patterns are selectable but not draggable. */}
        <g data-handles>
          {/* Hit areas in stacking order, except that patterns go beneath
              everything: they cover the whole nail and would otherwise
              swallow presses meant for the elements on top of them. */}
          {[
            ...shown.elements.filter((element) => element.kind === "pattern"),
            ...shown.elements.filter((element) => element.kind !== "pattern"),
          ].map((element) => {
            const elementDefinition = definitionOf(
              element.kind,
              element.variant,
            );
            const width = (elementDefinition?.width ?? 16) * element.scale;
            const height = (elementDefinition?.height ?? 16) * element.scale;
            const isPattern = element.kind === "pattern";
            const hit =
              isPattern ?
                { x: -30, y: tip - 4, width: 60, height: 68 - tip }
              : {
                  x: -width / 2 - 4,
                  y: -height / 2 - 4,
                  width: width + 8,
                  height: height + 8,
                };

            return (
              <g
                key={element.id}
                role="button"
                tabIndex={0}
                aria-label={elementLabel(element)}
                aria-describedby={hintId}
                aria-pressed={element.id === selected}
                className="cursor-move outline-none"
                transform={
                  isPattern ? undefined : (
                    `translate(${element.x.toFixed(1)} ${element.y.toFixed(1)}) rotate(${element.rotation.toFixed(1)})`
                  )
                }
                onPointerDown={(event) => {
                  if (isPattern) {
                    onSelect(element.id);
                    return;
                  }
                  beginDrag(event, element, "move");
                }}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={(event) => {
                  keyboard(event, element);
                }}
                onFocus={() => {
                  onSelect(element.id);
                }}
              >
                <rect {...hit} fill="transparent" stroke="none" />
              </g>
            );
          })}
          {selectedElement &&
            definition &&
            (selectedElement.kind === "pattern" ?
              <g>
                <path
                  d={nailOutline(form)}
                  stroke={PALETTE.rose}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  pointerEvents="none"
                />
                <DeleteHandle
                  cx={30}
                  cy={tip - 8}
                  label={deleteLabel}
                  onDelete={() => {
                    onDelete(selectedElement.id);
                  }}
                />
              </g>
            : <g
                transform={`translate(${selectedElement.x.toFixed(1)} ${selectedElement.y.toFixed(1)}) rotate(${selectedElement.rotation.toFixed(1)})`}
                stroke={PALETTE.rose}
              >
                <rect
                  x={(-definition.width * selectedElement.scale) / 2 - 2}
                  y={(-definition.height * selectedElement.scale) / 2 - 2}
                  width={definition.width * selectedElement.scale + 4}
                  height={definition.height * selectedElement.scale + 4}
                  strokeWidth="0.8"
                  strokeDasharray="2 1.5"
                  pointerEvents="none"
                />
                <line
                  x1="0"
                  y1={(-definition.height * selectedElement.scale) / 2 - 2}
                  x2="0"
                  y2={(-definition.height * selectedElement.scale) / 2 - 14}
                  strokeWidth="0.8"
                  pointerEvents="none"
                />
                {/* Rotate handle above, scale handle at the bottom right;
                    the hit circles are far larger than the drawn dots. */}
                <g
                  className="cursor-grab"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    beginDrag(event, selectedElement, "rotate");
                  }}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <circle
                    cy={(-definition.height * selectedElement.scale) / 2 - 14}
                    r={HIT}
                    fill="transparent"
                    stroke="none"
                  />
                  <circle
                    cy={(-definition.height * selectedElement.scale) / 2 - 14}
                    r="4.2"
                    fill={PALETTE.rose}
                    stroke={PALETTE.burgundyDeep}
                    strokeWidth="0.8"
                  />
                </g>
                {resizable(selectedElement) && (
                  <g
                    className="cursor-nwse-resize"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      beginDrag(event, selectedElement, "scale");
                    }}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    <circle
                      cx={(definition.width * selectedElement.scale) / 2 + 2}
                      cy={(definition.height * selectedElement.scale) / 2 + 2}
                      r={HIT}
                      fill="transparent"
                      stroke="none"
                    />
                    <rect
                      x={(definition.width * selectedElement.scale) / 2 - 1.8}
                      y={(definition.height * selectedElement.scale) / 2 - 1.8}
                      width="7.6"
                      height="7.6"
                      rx="1"
                      fill={PALETTE.rose}
                      stroke={PALETTE.burgundyDeep}
                      strokeWidth="0.8"
                    />
                  </g>
                )}
                <DeleteHandle
                  cx={(definition.width * selectedElement.scale) / 2 + 8}
                  cy={(-definition.height * selectedElement.scale) / 2 - 8}
                  label={deleteLabel}
                  onDelete={() => {
                    onDelete(selectedElement.id);
                  }}
                />
              </g>)}
        </g>
      </NailView>
      <p id={hintId} className="sr-only">
        {hint}
      </p>
    </div>
  );
};

export { NailEditor, NailView, SCALE_RANGE };
