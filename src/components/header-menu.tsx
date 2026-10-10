"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";

// The phone header's hamburger and the panel it drops below the header.
// The panel's links are rendered by the server; this only tracks whether
// the panel is open, and closes it when a link is followed or Escape is
// pressed.
const HeaderMenu = ({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) => {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<HTMLDivElement>();
  const panelId = useId();

  // Following a link closes the menu. The links are server-rendered, so
  // the panel listens for the click rather than each link.
  useEffect(() => {
    if (!panel) return;
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) setOpen(false);
    };
    panel.addEventListener("click", onClick);

    return () => {
      panel.removeEventListener("click", onClick);
    };
  }, [panel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    globalThis.addEventListener("keydown", onKey);

    return () => {
      globalThis.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const bar =
    "absolute left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-[translate,rotate,opacity] duration-300 motion-reduce:transition-none";

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="relative size-11 shrink-0 cursor-pointer rounded-full text-white transition-colors hover:text-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose md:hidden"
      >
        <span
          aria-hidden="true"
          className={`${bar} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[calc(50%-7px)]"}`}
        />
        <span
          aria-hidden="true"
          className={`${bar} top-1/2 -translate-y-1/2 ${open ? "opacity-0" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`${bar} ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[calc(50%+7px)]"}`}
        />
      </button>
      {/* The panel hangs under the sticky header and slides open; it stays
          in the DOM so the links are there for search engines and the
          transition has something to animate. */}
      <div
        id={panelId}
        ref={(node) => {
          setPanel(node ?? undefined);
        }}
        inert={!open}
        className={`absolute inset-x-0 top-full grid overflow-hidden bg-burgundy-deep/95 shadow-xl shadow-burgundy-deep/40 backdrop-blur-md transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none md:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </>
  );
};

export { HeaderMenu };
