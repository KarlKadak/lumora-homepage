"use client";

import { memo, useId, useState } from "react";
import {
  ChipRow,
  ColorPanel,
  ELEMENT_COLORS,
  POLISHES,
} from "@/components/builder/color-panel";
import {
  definitionOf,
  type ElementDefinition,
  ELEMENTS,
  PATTERN_SETTINGS,
  STONE_COLOR_KEYS,
  STONE_COLORS,
  TWO_TONE,
} from "@/components/builder/elements";
import { NailView, SCALE_RANGE } from "@/components/builder/nail-editor";
import { ICONS } from "@/components/builder/stage";
import type {
  DesignerState,
  ElementKind,
  Finger,
  NailElement,
  Paint,
  Side,
  Target,
} from "@/components/builder/state";
import { handOf } from "@/components/builder/state";
import type { NailForm } from "@/components/nail-form";
import type { DesignerCopy, FingerName } from "@/content/dictionary";

// The design mode's panel: the finger strip, the nail's base colour, the
// element catalogue, the selected element's properties and copying the
// design to other nails.

const FINGER_NAMES: readonly FingerName[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky",
];

const fingerName = (copy: DesignerCopy, finger: Finger) =>
  copy.fingers[FINGER_NAMES[finger] ?? "index"];

const sideName = (copy: DesignerCopy, side: Side) => copy.hands[side];

// The element tiles, drawn once per form: they do not change while a
// design is being edited.
const Catalogue = memo(
  ({
    kind,
    form,
    copy,
    prefix,
    defs,
    onAdd,
  }: Readonly<{
    kind: ElementKind;
    form: NailForm;
    copy: DesignerCopy;
    prefix: string;
    defs: string;
    onAdd: (definition: ElementDefinition) => void;
  }>) => (
    <ul role="tabpanel" className="grid grid-cols-5 gap-1 sm:grid-cols-6">
      {ELEMENTS[kind].map((item) => (
        <li key={item.variant}>
          <button
            type="button"
            onClick={() => {
              onAdd(item);
            }}
            className="flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-xl p-1 transition-[background-color,transform] duration-200 hover:bg-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose"
          >
            <NailView
              design={{
                paint:
                  item.kind === "pattern" ?
                    { kind: "solid", hex: "#cf8e80" }
                  : { kind: "solid", hex: "#ebc9c1" },
                elements: [
                  {
                    id: `tile-${item.variant}`,
                    kind: item.kind,
                    variant: item.variant,
                    x: 0,
                    y: item.kind === "pattern" ? 0 : -10,
                    scale: item.kind === "pattern" ? 1 : 1.6,
                    rotation: 0,
                    flip: false,
                    color: item.color,
                    ...(item.color2 === undefined ?
                      {}
                    : { color2: item.color2 }),
                    ...(item.offset === undefined ?
                      {}
                    : { offset: item.offset }),
                  },
                ],
              }}
              form={form}
              prefix={`${prefix}-tile-${item.variant}`}
              defs={defs}
              outlined={item.kind === "pattern"}
              className="h-12"
            />
            <span className="text-center text-[0.58rem] leading-tight font-semibold">
              {copy.elements[item.variant] ?? item.variant}
            </span>
          </button>
        </li>
      ))}
    </ul>
  ),
);

Catalogue.displayName = "Catalogue";

// All nails | Only this nail, as a sliding two-way toggle.
const Toggle = ({
  value,
  copy,
  onChange,
}: Readonly<{
  value: boolean;
  copy: DesignerCopy;
  onChange: (all: boolean) => void;
}>) => (
  <div
    role="group"
    aria-label={copy.design.applyTo}
    className="relative inline-grid grid-cols-2 rounded-full bg-white p-0.5"
  >
    <span
      aria-hidden="true"
      className={`absolute top-0.5 bottom-0.5 w-[calc(50%-0.125rem)] rounded-full bg-rose transition-[left] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${value ? "left-0.5" : "left-1/2"}`}
    />
    {[
      { all: true, label: copy.design.allNails },
      { all: false, label: copy.design.onlyThis },
    ].map(({ all, label }) => (
      <button
        key={label}
        type="button"
        aria-pressed={value === all}
        onClick={() => {
          onChange(all);
        }}
        className={`relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose ${value === all ? "text-burgundy-deep" : "text-burgundy"}`}
      >
        {label}
      </button>
    ))}
  </div>
);

// The polish's name in the current language, for announcements.
const paintName = (copy: DesignerCopy, paint: Paint) => {
  const key =
    paint.kind === "solid" ?
      (POLISHES.find((polish) => polish.hex === paint.hex)?.id ?? paint.hex)
    : paint.id;

  return copy.color.names[key] ?? key;
};

const chip =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-rose/60 px-3.5 py-2 text-xs font-semibold text-burgundy transition-colors hover:bg-rose/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose disabled:cursor-default disabled:opacity-40";

const chipPressed = "bg-rose text-burgundy-deep hover:bg-rose";

// The shuffle beside a section label. In the phone's popups, whose header
// names the section, it shrinks to the icon alone.
const ShuffleChip = ({
  label,
  iconOnly,
  onClick,
}: Readonly<{ label: string; iconOnly: boolean; onClick: () => void }>) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={iconOnly ? label : undefined}
    title={iconOnly ? label : undefined}
    className={iconOnly ? iconChip : chip}
  >
    {ICONS.shuffle}
    {!iconOnly && <span className="ml-1.5">{label}</span>}
  </button>
);

const iconChip =
  "flex size-11 cursor-pointer items-center justify-center rounded-full border border-rose/60 text-burgundy transition-[background-color,transform] duration-200 hover:bg-rose/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose [&>svg]:size-5";

const sectionLabel =
  "text-xs font-semibold tracking-widest text-plum uppercase";

// One block of the panel on its own, for the phone's popups.
type DesignPart = "color" | "add" | "layers";

interface DesignPanelProperties {
  part?: DesignPart;
  state: DesignerState;
  target: Target;
  selected: string | undefined;
  copy: DesignerCopy;
  prefix: string;
  // The shared gradient defs' id prefix.
  defs: string;
  onSelect: (id: string | undefined) => void;
  onAdd: (definition: ElementDefinition) => void;
  onPatch: (id: string, patch: Partial<Omit<NailElement, "id">>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, by: 1 | -1) => void;
  // Edits go to every nail while this is on; likewise for the polish.
  designAll: boolean;
  onDesignAll: (all: boolean) => void;
  paintAll: boolean;
  onPaintAll: (all: boolean) => void;
  // Replaces this nail's decoration with a random design.
  onRandom: () => void;
  // Paints this nail, or every nail when `all` is set.
  onPaint: (paint: Paint, name: string, all: boolean) => void;
  onRandomPaint: (all: boolean) => void;
  onDone: () => void;
}

const DesignPanel = ({
  part,
  state,
  target,
  selected,
  copy,
  prefix,
  defs,
  onSelect,
  onAdd,
  onPatch,
  onDelete,
  onDuplicate,
  onReorder,
  designAll,
  onDesignAll,
  paintAll,
  onPaintAll,
  onRandom,
  onPaint,
  onRandomPaint,
  onDone,
}: Readonly<DesignPanelProperties>) => {
  // Colour picks go to every nail unless the visitor unticks it.
  const [tab, setTab] = useState<ElementKind>("pattern");
  const sizeId = useId();
  const rotationId = useId();
  const offsetId = useId();
  const hand = handOf(state, target.side);
  const design = hand.nails[target.finger];
  const element = design?.elements.find((item) => item.id === selected);
  const definition = element && definitionOf(element.kind, element.variant);
  const setting =
    element?.kind === "pattern" ? PATTERN_SETTINGS[element.variant] : undefined;
  const settingLabel =
    setting === "angle" ? copy.design.rotation
    : setting === undefined ? copy.design.offset
    : copy.design.offset;

  const tabs: readonly { kind: ElementKind; label: string }[] = [
    { kind: "pattern", label: copy.design.patterns },
    { kind: "illustration", label: copy.design.illustrations },
    { kind: "stone", label: copy.design.stones },
  ];

  const shows = (block: DesignPart) => part === undefined || part === block;
  // The phone's popups name the section in their header.
  const inPopup = part !== undefined;
  const randomPaint = () => {
    onRandomPaint(paintAll);
  };

  if (!design) return undefined;

  return (
    <div className="space-y-5">
      {shows("color") && (
        <div className="flex items-center justify-between gap-2">
          <Toggle
            value={paintAll}
            copy={copy}
            onChange={(all) => {
              onPaintAll(all);
              if (all)
                onPaint(design.paint, paintName(copy, design.paint), true);
            }}
          />
          {inPopup && (
            <ShuffleChip
              label={copy.toolbar.random}
              iconOnly
              onClick={randomPaint}
            />
          )}
        </div>
      )}

      {shows("color") && (
        <div>
          {/* The phone's popup carries the title itself, and its shuffle
              sits beside the toggle above. */}
          {!inPopup && (
            <div className="flex items-center justify-between gap-2">
              <p className={sectionLabel}>{copy.panels.color}</p>
              <ShuffleChip
                label={copy.toolbar.random}
                iconOnly={false}
                onClick={randomPaint}
              />
            </div>
          )}
          <div className={inPopup ? undefined : "mt-2"}>
            <ColorPanel
              value={design.paint}
              copy={copy}
              prefix={defs}
              onChange={(paint, name) => {
                onPaint(paint, name, paintAll);
              }}
            />
          </div>
        </div>
      )}

      {shows("add") && (
        <div className="flex items-center justify-between gap-2">
          <Toggle value={designAll} copy={copy} onChange={onDesignAll} />
          {inPopup && (
            <ShuffleChip
              label={copy.toolbar.random}
              iconOnly
              onClick={onRandom}
            />
          )}
        </div>
      )}

      {shows("add") && (
        <div>
          {!inPopup && (
            <div className="flex items-center justify-between gap-2">
              <p className={sectionLabel}>{copy.design.addElement}</p>
              <ShuffleChip
                label={copy.toolbar.random}
                iconOnly={false}
                onClick={onRandom}
              />
            </div>
          )}
          <div role="tablist" className={`flex gap-1 ${inPopup ? "" : "mt-2"}`}>
            {tabs.map(({ kind, label }) => (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={tab === kind}
                onClick={() => {
                  setTab(kind);
                }}
                className={`${chip} ${tab === kind ? chipPressed : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Catalogue
              kind={tab}
              form={hand.form}
              copy={copy}
              prefix={prefix}
              defs={defs}
              onAdd={onAdd}
            />
          </div>
        </div>
      )}

      {shows("layers") && design.elements.length > 0 && (
        <div>
          <p className={sectionLabel}>{copy.design.layers}</p>
          {/* Topmost first, as they lie on the nail. */}
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {design.elements.toReversed().map((item) => (
              <li key={item.id} className="flex items-center">
                <button
                  type="button"
                  aria-pressed={item.id === selected}
                  onClick={() => {
                    onSelect(item.id === selected ? undefined : item.id);
                  }}
                  className={`${chip} gap-1.5 rounded-r-none ${item.id === selected ? chipPressed : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border border-burgundy/30"
                    style={{
                      background:
                        item.kind === "stone" ?
                          (STONE_COLORS[item.color]?.base ?? item.color)
                        : item.color,
                    }}
                  />
                  {copy.elements[item.variant] ?? item.variant}
                </button>
                <button
                  type="button"
                  aria-label={`${copy.design.delete}: ${copy.elements[item.variant] ?? item.variant}`}
                  title={copy.design.delete}
                  onClick={() => {
                    onDelete(item.id);
                    if (item.id === selected) onSelect(undefined);
                  }}
                  className="flex min-h-11 w-9 cursor-pointer items-center justify-center rounded-r-full border border-l-0 border-rose/60 text-[#d8323c] transition-colors hover:bg-[#d8323c]/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!shows("layers") ?
        undefined
      : element && definition ?
        <div className="space-y-3 rounded-2xl bg-white/60 p-3">
          <p className="text-sm font-semibold text-burgundy">
            {copy.design.selected}:{" "}
            {copy.elements[element.variant] ?? element.variant}
          </p>
          {element.kind === "illustration" && (
            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor={sizeId} className="font-semibold">
                  {copy.design.size}
                </label>
                <output htmlFor={sizeId}>{element.scale.toFixed(1)}×</output>
              </div>
              <input
                id={sizeId}
                type="range"
                min={SCALE_RANGE.min}
                max={SCALE_RANGE.max}
                step="0.1"
                value={element.scale}
                onChange={(event) => {
                  onPatch(element.id, { scale: Number(event.target.value) });
                }}
                className="level-slider h-11 w-full"
              />
            </div>
          )}
          {element.kind !== "pattern" && (
            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor={rotationId} className="font-semibold">
                  {copy.design.rotation}
                </label>
                <output htmlFor={rotationId}>
                  {Math.round(element.rotation)}°
                </output>
              </div>
              <input
                id={rotationId}
                type="range"
                min="-180"
                max="180"
                step="1"
                value={Math.round(
                  ((((element.rotation + 180) % 360) + 360) % 360) - 180,
                )}
                onChange={(event) => {
                  onPatch(element.id, { rotation: Number(event.target.value) });
                }}
                className="level-slider h-11 w-full"
              />
            </div>
          )}
          {setting && (
            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor={offsetId} className="font-semibold">
                  {settingLabel}
                </label>
              </div>
              <input
                id={offsetId}
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={element.offset ?? definition.offset ?? 0.5}
                onChange={(event) => {
                  onPatch(element.id, { offset: Number(event.target.value) });
                }}
                className="level-slider h-11 w-full"
              />
            </div>
          )}
          {element.kind === "stone" ?
            <ChipRow
              value={element.color}
              options={STONE_COLOR_KEYS}
              label={copy.design.color}
              swatch={(key) => {
                const palette = STONE_COLORS[key];

                return palette ?
                    `radial-gradient(circle at 35% 30%, ${palette.light}, ${palette.base} 55%, ${palette.dark})`
                  : key;
              }}
              onChange={(color) => {
                onPatch(element.id, { color });
              }}
            />
          : <ChipRow
              value={element.color}
              options={ELEMENT_COLORS}
              label={copy.design.color}
              onChange={(color) => {
                onPatch(element.id, { color });
              }}
            />
          }
          {(TWO_TONE.has(element.variant) ||
            (element.kind === "illustration" &&
              definition.color2 !== undefined)) && (
            <ChipRow
              value={element.color2 ?? definition.color2 ?? "#1c1118"}
              options={ELEMENT_COLORS}
              label={copy.design.color2}
              onChange={(color2) => {
                onPatch(element.id, { color2 });
              }}
            />
          )}
          {/* Flip, duplicate, forward, back, delete: icons with their
              names as tooltips and accessible labels. */}
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                key: "flip",
                label: copy.design.flip,
                icon: ICONS.flip,
                pressed: element.flip,
                onClick: () => {
                  onPatch(element.id, { flip: !element.flip });
                },
              },
              {
                key: "duplicate",
                label: copy.design.duplicate,
                icon: ICONS.duplicate,
                onClick: () => {
                  onDuplicate(element.id);
                },
              },
              {
                key: "forward",
                label: copy.design.forward,
                icon: ICONS.forward,
                onClick: () => {
                  onReorder(element.id, 1);
                },
              },
              {
                key: "back",
                label: copy.design.back,
                icon: ICONS.back,
                onClick: () => {
                  onReorder(element.id, -1);
                },
              },
            ].map((action) => (
              <button
                key={action.key}
                type="button"
                aria-label={action.label}
                title={action.label}
                aria-pressed={action.pressed}
                onClick={action.onClick}
                className={`${iconChip} ${action.pressed ? chipPressed : ""}`}
              >
                {action.icon}
              </button>
            ))}
            <button
              type="button"
              aria-label={copy.design.delete}
              title={copy.design.delete}
              onClick={() => {
                onDelete(element.id);
                onSelect(undefined);
              }}
              className={`${iconChip} border-[#d8323c]/60 text-[#d8323c] hover:bg-[#d8323c]/10`}
            >
              {ICONS.close}
            </button>
          </div>
        </div>
      : <p className="text-sm text-plum">
          {design.elements.length > 0 ? copy.design.pick : copy.design.empty}
        </p>
      }

      {part === undefined && (
        <button
          type="button"
          onClick={onDone}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-rose px-6 py-3 text-sm font-semibold text-burgundy-deep transition-colors hover:bg-rose-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
        >
          {copy.design.done}
        </button>
      )}
    </div>
  );
};

// A nail-local y as a percentage from the tip, for element labels.
const percentFromTip = (y: number, form: NailForm) => {
  const top = -(30 + 20 * (form.length - 1));

  return Math.round(((y - top) / (64 - top)) * 100);
};

export { DesignPanel, FINGER_NAMES, fingerName, percentFromTip, sideName };

export type { DesignPart };
