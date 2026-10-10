"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Paint } from "@/components/builder/state";
import {
  loadRecentColors,
  saveRecentColors,
} from "@/components/builder/storage";
import type { DesignerCopy } from "@/content/dictionary";

// Swatches of curated polishes, the special finishes, a native colour input
// for anything else, and the last few custom picks.

interface Polish {
  id: string;
  hex: string;
}

const POLISHES: readonly Polish[] = [
  { id: "rose", hex: "#cf8e80" },
  { id: "rose-soft", hex: "#ebc9c1" },
  { id: "pearl", hex: "#fbf5f3" },
  { id: "milk", hex: "#f3e9e4" },
  { id: "nude", hex: "#d9b3a2" },
  { id: "coral", hex: "#e8846b" },
  { id: "cherry", hex: "#a3122c" },
  { id: "burgundy", hex: "#4a0d1c" },
  { id: "plum", hex: "#80525b" },
  { id: "lavender", hex: "#b9a3d6" },
  { id: "sage", hex: "#9db59a" },
  { id: "ink", hex: "#1c1118" },
];

const FINISHES: readonly string[] = [
  "chrome",
  "holo",
  "cat-eye",
  "aurora",
  "galaxy",
  "ombre",
  "sunset",
  "candy",
  "ocean",
];

const samePaint = (a: Paint, b: Paint) =>
  a.kind === "solid" && b.kind === "solid" ?
    a.hex.toLowerCase() === b.hex.toLowerCase()
  : a.kind === "finish" && b.kind === "finish" && a.id === b.id;

const RECENT_LIMIT = 6;
const RECENT_DEBOUNCE = 500;

// A nail-shaped swatch; `prefix` names the defs of the SVG that holds the
// gradients, which the panel brings along itself.
const Swatch = ({
  paint,
  prefix,
  label,
  selected,
  onPick,
}: Readonly<{
  paint: Paint;
  prefix: string;
  label: string;
  selected: boolean;
  onPick: () => void;
}>) => (
  <li>
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`flex w-full min-w-11 cursor-pointer flex-col items-center gap-1 rounded-2xl p-1.5 pt-2 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose ${selected ? "bg-white ring-2 ring-rose ring-inset" : ""}`}
    >
      <svg viewBox="-30 -78 60 148" className="h-12" aria-hidden="true">
        <path
          d="M-24 52V-6C-24-40-10-62 0-70C10-62 24-40 24-6V52C24 64-24 64-24 52Z"
          fill={
            paint.kind === "solid" ?
              paint.hex
            : `url(#${prefix}-paint-${paint.id})`
          }
          stroke="#4a0d1c"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        {selected && (
          <path
            d="M-9 2L-3 8L10-8"
            fill="none"
            stroke="#4a0d1c"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}
      </svg>
      <span className="text-center text-[0.62rem] leading-tight font-semibold whitespace-nowrap">
        {label}
      </span>
    </button>
  </li>
);

const ColorPanel = ({
  value,
  copy,
  prefix,
  onChange,
}: Readonly<{
  value: Paint;
  copy: DesignerCopy;
  prefix: string;
  onChange: (paint: Paint, name: string) => void;
}>) => {
  const customId = useId();
  const [recent, setRecent] = useState<readonly string[]>([]);

  useEffect(() => {
    setRecent(loadRecentColors());
  }, []);

  // The native picker fires on every drag step; the nails follow at once,
  // but a colour joins the recents only once it has rested for a moment.
  const rememberTimer = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(rememberTimer.current);
    },
    [],
  );

  const pickCustom = (hex: string) => {
    onChange({ kind: "solid", hex }, hex);
    clearTimeout(rememberTimer.current);
    rememberTimer.current = window.setTimeout(() => {
      setRecent((current) => {
        const next = [hex, ...current.filter((item) => item !== hex)].slice(
          0,
          RECENT_LIMIT,
        );

        saveRecentColors(next);

        return next;
      });
    }, RECENT_DEBOUNCE);
  };

  const custom = value.kind === "solid" ? value.hex : "#cf8e80";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-widest text-plum uppercase">
          {copy.color.polishes}
        </p>
        <ul className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-5">
          {POLISHES.map((polish) => (
            <Swatch
              key={polish.id}
              paint={{ kind: "solid", hex: polish.hex }}
              prefix={prefix}
              label={copy.color.names[polish.id] ?? polish.id}
              selected={samePaint(value, { kind: "solid", hex: polish.hex })}
              onPick={() => {
                onChange(
                  { kind: "solid", hex: polish.hex },
                  copy.color.names[polish.id] ?? polish.id,
                );
              }}
            />
          ))}
          <li>
            <label
              htmlFor={customId}
              className="relative flex min-h-full w-full min-w-11 cursor-pointer flex-col items-center gap-1 rounded-2xl p-1.5 pt-2 transition-colors hover:bg-white focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-rose"
            >
              <span
                aria-hidden="true"
                className="h-12 w-7 rounded-full border border-burgundy/30"
                style={{
                  background:
                    "conic-gradient(#f87171, #fbbf24, #4ade80, #60a5fa, #c084fc, #f87171)",
                }}
              />
              <span className="text-center text-[0.62rem] leading-tight font-semibold whitespace-nowrap">
                {copy.color.custom}
              </span>
              <input
                id={customId}
                type="color"
                value={custom}
                onChange={(event) => {
                  pickCustom(event.target.value);
                }}
                className="sr-only"
              />
            </label>
          </li>
        </ul>
      </div>
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-plum uppercase">
            {copy.color.recent}
          </p>
          <ul className="mt-2 grid grid-cols-5 gap-1">
            {recent.map((hex) => (
              <Swatch
                key={hex}
                paint={{ kind: "solid", hex }}
                prefix={prefix}
                label={hex}
                selected={samePaint(value, { kind: "solid", hex })}
                onPick={() => {
                  onChange({ kind: "solid", hex }, hex);
                }}
              />
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold tracking-widest text-plum uppercase">
          {copy.color.finishes}
        </p>
        <ul className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-5">
          {FINISHES.map((id) => (
            <Swatch
              key={id}
              paint={{ kind: "finish", id }}
              prefix={prefix}
              label={copy.color.names[id] ?? id}
              selected={samePaint(value, { kind: "finish", id })}
              onPick={() => {
                onChange({ kind: "finish", id }, copy.color.names[id] ?? id);
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

// Swatches for an element's colour: a compact row of hex chips.
const ELEMENT_COLORS: readonly string[] = [
  "#fbf5f3",
  "#ffffff",
  "#ebc9c1",
  "#cf8e80",
  "#a3122c",
  "#4a0d1c",
  "#80525b",
  "#1c1118",
  "#e9c46a",
  "#b8743f",
  "#9db59a",
  "#2f6b2e",
  "#b9a3d6",
  "#2a5bd7",
  "#7fc4ff",
];

const ChipRow = ({
  value,
  options,
  label,
  swatch,
  onChange,
}: Readonly<{
  value: string;
  options: readonly string[];
  label: string;
  // How to paint a chip for a value, when it is not itself a colour.
  swatch?: (option: string) => string;
  onChange: (value: string) => void;
}>) => {
  const customId = useId();

  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-plum uppercase">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={option}
            aria-pressed={option === value}
            onClick={() => {
              onChange(option);
            }}
            className={`size-11 cursor-pointer rounded-full border-2 p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose ${option === value ? "border-burgundy" : "border-transparent hover:border-rose"}`}
          >
            <span
              className="block size-full rounded-full border border-burgundy/25"
              style={{ background: swatch ? swatch(option) : option }}
            />
          </button>
        ))}
        {!swatch && (
          <label
            htmlFor={customId}
            aria-label={label}
            className="relative flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-transparent p-1 hover:border-rose focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-rose"
          >
            <span
              className="block size-full rounded-full border border-burgundy/25"
              style={{
                background:
                  "conic-gradient(#f87171, #fbbf24, #4ade80, #60a5fa, #c084fc, #f87171)",
              }}
            />
            <input
              id={customId}
              type="color"
              value={/^#[\da-f]{6}$/i.test(value) ? value : "#cf8e80"}
              onChange={(event) => {
                onChange(event.target.value);
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>
    </div>
  );
};

export { ChipRow, ColorPanel, ELEMENT_COLORS, FINISHES, POLISHES };
