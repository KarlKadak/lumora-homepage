"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";

// The menu's two shells: an accordion card on desktop and a bottom sheet
// with tabs on phones, whose submenu points open popups. Both take the same sections.

type Panel = "length" | "shape" | "sharpness" | "design";

// A submenu point: on phones a section lists these, and each opens its
// controls in a popup.
interface Part {
  key: string;
  title: string;
  content: ReactNode;
  // A control that sits in the popup's header, such as a shuffle.
  action?: ReactNode;
}

interface Section {
  key: Panel;
  title: string;
  // Desktop: the whole section's controls in the accordion.
  content: ReactNode;
  // A control that sits in the section's header, such as a shuffle.
  action?: ReactNode;
  // Phone: the section's submenu points; without them the sheet shows
  // the content itself.
  parts?: readonly Part[];
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
// workspace. A section with submenu points lists them instead of its
// controls; a point opens them in a popup floating over the stage, so the
// hands stay in view.
const Sheet = ({
  sections,
  open,
  onOpen,
  part,
  onPart,
  header,
  closeLabel,
}: Readonly<{
  sections: readonly Section[];
  open: Panel | undefined;
  onOpen: (panel: Panel) => void;
  // The open submenu point of the open section.
  part: string | undefined;
  onPart: (part: string | undefined) => void;
  header?: ReactNode;
  closeLabel: string;
}>) => {
  const baseId = useId();
  const section = sections.find((item) => item.key === open);
  const point = section?.parts?.find((item) => item.key === part);

  useEffect(() => {
    if (!point) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPart(undefined);
    };

    globalThis.addEventListener("keydown", onKey);

    return () => {
      globalThis.removeEventListener("keydown", onKey);
    };
  }, [point, onPart]);

  return (
    <div className="relative z-30 flex min-h-0 shrink-0 flex-col rounded-t-3xl bg-pearl text-ink shadow-[0_-8px_30px_rgba(42,5,16,0.35)]">
      {/* The popup: every point of every section stays mounted, so the
          controls keep their state; the open one shows. It fades in and
          vanishes at once, so nothing lingers over the stage. */}
      <div
        className={`absolute inset-x-2 bottom-full mb-2 flex max-h-[38dvh] flex-col rounded-2xl bg-pearl text-ink shadow-[0_8px_30px_rgba(42,5,16,0.45)] motion-reduce:transition-none ${point ? "opacity-100 transition-opacity duration-200" : "pointer-events-none opacity-0 transition-none"}`}
        inert={!point}
      >
        {sections.flatMap((item) =>
          (item.parts ?? []).map((entry) => {
            const active = point !== undefined && entry === point;

            return (
              <div
                key={`${item.key}-${entry.key}`}
                id={`${baseId}-${item.key}-${entry.key}-popup`}
                role="region"
                aria-labelledby={`${baseId}-${item.key}-${entry.key}-point`}
                inert={!active}
                className={`flex max-h-[38dvh] min-h-0 flex-col ${active ? "" : "pointer-events-none absolute inset-0 opacity-0"}`}
              >
                <div className="flex shrink-0 items-center gap-2 pt-2 pr-2 pl-4">
                  <h3 className="min-w-0 flex-1 truncate font-serif text-lg leading-tight text-burgundy italic">
                    {entry.title}
                  </h3>
                  {entry.action}
                  <button
                    type="button"
                    aria-label={closeLabel}
                    title={closeLabel}
                    onClick={() => {
                      onPart(undefined);
                    }}
                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl leading-none text-rose transition-colors hover:bg-white hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose"
                  >
                    <span aria-hidden="true" className="rotate-45">
                      +
                    </span>
                  </button>
                </div>
                <div className="min-h-0 overflow-y-auto px-4 pt-1 pb-4">
                  {entry.content}
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="h-3 shrink-0" />
      {header && <div className="shrink-0 px-4 pb-2">{header}</div>}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
        <div
          role="tablist"
          className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto [scrollbar-width:none]"
        >
          {sections.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`${baseId}-${item.key}-tab`}
              aria-selected={open === item.key}
              aria-controls={`${baseId}-${item.key}-panel`}
              onClick={() => {
                onOpen(item.key);
              }}
              className={`min-h-10 shrink-0 cursor-pointer rounded-full px-3.5 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose ${open === item.key ? "bg-rose text-burgundy-deep" : "text-burgundy hover:bg-white"}`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
      {/* The active section: its submenu points, or its controls. */}
      <div
        className={`grid min-h-0 transition-[grid-template-rows] duration-400 ${EASE} motion-reduce:transition-none ${section ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        {/* Every tab's panel shares one grid cell, so the sheet is as tall
            as the tallest tab whichever is active. */}
        <div className="grid min-h-0 overflow-hidden">
          {sections.map((item) => {
            const active = item.key === open;

            return (
              <div
                key={item.key}
                id={`${baseId}-${item.key}-panel`}
                role="tabpanel"
                aria-labelledby={`${baseId}-${item.key}-tab`}
                inert={!active}
                className={`flex max-h-[42dvh] min-h-0 flex-col justify-center overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 [grid-area:1/1] motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                {item.parts ?
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {item.parts.map((entry) => {
                      const pressed = active && point === entry;

                      return (
                        <button
                          key={entry.key}
                          type="button"
                          id={`${baseId}-${item.key}-${entry.key}-point`}
                          aria-expanded={pressed}
                          aria-controls={`${baseId}-${item.key}-${entry.key}-popup`}
                          onClick={() => {
                            onPart(pressed ? undefined : entry.key);
                          }}
                          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-rose/60 px-4 text-xs font-semibold text-burgundy [-webkit-tap-highlight-color:transparent] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose"
                        >
                          {entry.title}
                          <span aria-hidden="true" className="text-rose">
                            ›
                          </span>
                        </button>
                      );
                    })}
                  </div>
                : <div className="flex items-end gap-3 pt-1">
                    <div className="min-w-0 flex-1">{item.content}</div>
                    {item.action && (
                      <div className="shrink-0 pb-2">{item.action}</div>
                    )}
                  </div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { Accordion, Sheet };

export type { Panel, Part, Section };
