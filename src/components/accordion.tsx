"use client";

import { useId, useState } from "react";
import Link from "next/link";
import type { Locale, Question } from "@/content/dictionary";
import { localePagePath } from "@/content/dictionary";

// Panels stay in the DOM and animate grid rows between 0fr and 1fr, so both
// opening and closing glide in every modern browser. One panel open at a time.
// The locale resolves the page a question's answer may link on to.
const Accordion = ({
  items,
  locale,
}: Readonly<{ items: Question[]; locale: Locale }>) => {
  const [openIndex, setOpenIndex] = useState<number | undefined>(0);
  const baseId = useId();

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-button-${String(index)}`;
        const panelId = `${baseId}-panel-${String(index)}`;

        return (
          <div
            key={item.question}
            className="reveal rounded-[1.75rem] bg-pearl px-5 sm:px-7"
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  setOpenIndex(isOpen ? undefined : index);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-serif text-2xl leading-tight text-burgundy italic sm:text-3xl">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-[rotate,background-color,color] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${isOpen ? "rotate-45 bg-rose text-burgundy-deep" : "bg-white text-rose"}`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-rose/30 pt-4 pb-6 leading-relaxed text-plum">
                  <p>{item.answer}</p>
                  {item.link && (
                    <Link
                      href={localePagePath(locale, item.link.page)}
                      className="mt-3 inline-block font-semibold text-burgundy underline decoration-rose/50 underline-offset-4 transition-colors hover:text-rose hover:decoration-rose"
                    >
                      {item.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
