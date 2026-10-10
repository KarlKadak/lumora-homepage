"use client";

import type { ReactNode } from "react";

// The stage's toolbar: pills on desktop, icon buttons on phones.

const toolButton =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-rose hover:text-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose disabled:cursor-default disabled:opacity-40 disabled:hover:border-white/20 disabled:hover:text-white";

interface Tool {
  key: string;
  label: string;
  // A fuller name for assistive tech, when the label is terse.
  title?: string;
  icon: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  busy?: boolean;
}

const Icon = ({ children }: Readonly<{ children: ReactNode }>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 shrink-0"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICONS = {
  hand: (
    <Icon>
      <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 13a1.4 1.4 0 0 1 2.3-1.6L8 13.5" />
    </Icon>
  ),
  menu: (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="m15 14 5-5-5-5M20 9h-9a6 6 0 0 0 0 12h3" />
    </Icon>
  ),
  reset: (
    <Icon>
      <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5" />
    </Icon>
  ),
  download: (
    <Icon>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </Icon>
  ),
  share: (
    <Icon>
      <path d="M12 15V4m0 0 4 4m-4-4L8 8M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  ),
  // Shuffle: two paths crossing over, for anything random.
  shuffle: (
    <Icon>
      <path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 4.8c1.1 1.6 2.3 2.6 4.3 2.6H21" />
      <path d="M3 17h3.5c2 0 3.2-1 4.3-2.6M13.2 9.6C14.3 8 15.5 7 17.5 7H21" />
      <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
    </Icon>
  ),
  // Mirror: two halves of a shape about a dashed axis.
  flip: (
    <Icon>
      <path d="M12 3v18" strokeDasharray="2 2" />
      <path d="M9 6 3 12l6 6ZM15 6l6 6-6 6Z" />
    </Icon>
  ),
  // Two overlapping squares.
  duplicate: (
    <Icon>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </Icon>
  ),
  // A square lifted over another, and one tucked under.
  forward: (
    <Icon>
      <rect x="4" y="10" width="10" height="10" rx="2" />
      <path d="M10 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4" />
      <path d="M17 2.5V8m0-5.5-2 2m2-2 2 2" strokeWidth="1.6" />
    </Icon>
  ),
  back: (
    <Icon>
      <rect x="10" y="4" width="10" height="10" rx="2" />
      <path d="M10 10H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4" />
      <path d="M7 21.5V16m0 5.5-2-2m2 2 2-2" strokeWidth="1.6" />
    </Icon>
  ),
  close: (
    <Icon>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  ),
  spinner: (
    <svg viewBox="0 0 24 24" className="size-4 animate-spin" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
};

// Icon buttons with their label underneath, as a column between the hands.
const Toolbar = ({
  tools,
  compact,
  horizontal = false,
  breakAfter,
  label,
}: Readonly<{
  tools: readonly Tool[];
  compact: boolean;
  horizontal?: boolean;
  // Horizontal only: the key of the last tool on the first row, so the
  // rows never reflow as labels change.
  breakAfter?: string;
  label: string;
}>) => {
  const split = tools.findIndex((tool) => tool.key === breakAfter);
  const rows =
    horizontal && split !== -1 ?
      [tools.slice(0, split + 1), tools.slice(split + 1)]
    : [tools];

  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      className={`flex flex-col items-center ${compact ? "gap-0" : "gap-1"}`}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className={`flex items-center justify-center ${horizontal ? "flex-row" : "flex-col"} ${compact ? "gap-0" : "gap-1"}`}
        >
          {row.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={tool.onClick}
              disabled={tool.disabled ?? tool.busy}
              aria-pressed={tool.pressed}
              aria-busy={tool.busy}
              aria-label={tool.title}
              title={tool.title}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[0.62rem] leading-none font-semibold transition-[color,background-color,transform] duration-200 hover:bg-white/10 hover:text-rose active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white ${tool.pressed ? "text-rose" : "text-white"} ${compact ? "w-[4.1rem] px-0.5" : "min-w-14"}`}
            >
              <span className="[&>svg]:size-5">
                {tool.busy ? ICONS.spinner : tool.icon}
              </span>
              <span className="whitespace-nowrap">{tool.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export { ICONS, Toolbar, toolButton };

export type { Tool };
