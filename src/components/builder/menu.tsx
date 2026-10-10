"use client";

import type { ReactNode } from "react";
import { useId } from "react";

// The menu's two shells: an accordion card on desktop and a bottom sheet
// with tabs on phones. Both take the same sections.

type Panel = "length" | "shape" | "sharpness" | "design";

interface Section {
  key: Panel;
  title: string;
  content: ReactNode;
  // A control that sits in the section's header, such as a shuffle.
  action?: ReactNode;
}

const EASE = "ease-[cubic-bezier(0.2,0.7,0.2,1)]";

// At most one section open at a time, and the open one closes when its
// header is pressed again; panels stay in the DOM and animate their grid
// rows, like the FAQ's accordion.
const Accordion = ({
  sections,
  open,
  onOpen,
}: Readonly<{
  sections: readonly Section[];
  open: Panel | undefined;
  onOpen: (panel: Panel | undefined) => void;
}>) => {
  const baseId = useId();

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isOpen = open === section.key;
        const buttonId = `${baseId}-${section.key}-button`;
        const panelId = `${baseId}-${section.key}-panel`;

        return (
          <div key={section.key} className="rounded-2xl bg-pearl px-4">
            {/* The shuffle sits just left of the +, which stays the far end
                of the toggle; the title leaves room for it. */}
            <div className="relative flex items-center">
              <h3 className="min-w-0 flex-1">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    onOpen(isOpen ? undefined : section.key);
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-2 text-left"
                >
                  <span
                    className={`font-serif text-xl leading-tight text-burgundy italic ${section.action ? "pr-12" : ""}`}
                  >
                    {section.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xl leading-none transition-[rotate,background-color,color] duration-300 motion-reduce:transition-none ${isOpen ? "rotate-45 bg-rose text-burgundy-deep" : "bg-white text-rose"}`}
                  >
                    +
                  </span>
                </button>
              </h3>
              {section.action && (
                <div className="absolute top-1/2 right-11 -translate-y-1/2">
                  {section.action}
                </div>
              )}
            </div>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-400 ${EASE} motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-rose/30 pt-3 pb-4">
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// A tab bar and the active section, as a sheet at the bottom of the
// workspace. The chevron button toggles between a peek state (tabs only)
// and open; switching tabs cross-fades the content.
const Sheet = ({
  sections,
  open,
  onOpen,
  header,
  expanded,
  onExpanded,
  label,
}: Readonly<{
  sections: readonly Section[];
  open: Panel | undefined;
  onOpen: (panel: Panel) => void;
  header?: ReactNode;
  expanded: boolean;
  onExpanded: (expanded: boolean) => void;
  label: string;
}>) => {
  const baseId = useId();

  return (
    <div
      className={`relative z-30 flex min-h-0 shrink-0 flex-col rounded-t-3xl bg-pearl text-ink shadow-[0_-8px_30px_rgba(42,5,16,0.35)] transition-[padding-bottom] duration-400 ${EASE} motion-reduce:transition-none ${expanded ? "pb-0" : "pb-9"}`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={label}
        onClick={() => {
          onExpanded(!expanded);
        }}
        className="flex h-9 w-full shrink-0 cursor-pointer items-center justify-center text-rose transition-colors hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rose"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`size-5 transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
        >
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>
      {header && <div className="shrink-0 px-4 pb-2">{header}</div>}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
        <div
          role="tablist"
          className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto [scrollbar-width:none]"
        >
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              role="tab"
              id={`${baseId}-${section.key}-tab`}
              aria-selected={open === section.key}
              aria-controls={`${baseId}-${section.key}-panel`}
              onClick={() => {
                // The active tab folds the sheet down and back up.
                if (open === section.key) {
                  onExpanded(!expanded);
                  return;
                }
                onOpen(section.key);
                onExpanded(true);
              }}
              className={`min-h-10 shrink-0 cursor-pointer rounded-full px-3.5 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose ${open === section.key ? "bg-rose text-burgundy-deep" : "text-burgundy hover:bg-white"}`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`grid min-h-0 transition-[grid-template-rows] duration-400 ${EASE} motion-reduce:transition-none ${expanded && open !== undefined ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="relative min-h-0 overflow-hidden">
          {sections.map((section) => {
            const active = section.key === open;

            return (
              <div
                key={section.key}
                id={`${baseId}-${section.key}-panel`}
                role="tabpanel"
                aria-labelledby={`${baseId}-${section.key}-tab`}
                inert={!active || !expanded}
                className={`max-h-[42dvh] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
              >
                {/* The section's shuffle sits beside its control, which
                    gives up that much width. */}
                <div className="flex items-end gap-3 pt-1">
                  <div className="min-w-0 flex-1">{section.content}</div>
                  {section.action && (
                    <div className="shrink-0 pb-2">{section.action}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { Accordion, Sheet };

export type { Panel, Section };
