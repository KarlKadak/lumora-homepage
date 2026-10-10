"use client";

import dynamic from "next/dynamic";
import type { DesignerCopy, Locale } from "@/content/dictionary";
import { getDictionary, LOCALES } from "@/content/dictionary";

type DesignerProperties = Readonly<{ locale: Locale; copy: DesignerCopy }>;

// The designer is laid out from the device's width and the stored draft,
// neither of which the static HTML can know, so it renders only in the
// browser. The placeholder keeps the workspace's height meanwhile, so the
// footer does not move when the designer appears, and carries the page's
// heading and lead so that the static HTML has indexable content. The copy
// mirrors the designer's desktop intro; on phones the designer keeps its
// title for assistive tech only, so the placeholder does the same.
const Placeholder = ({ copy }: Readonly<{ copy: DesignerCopy }>) => (
  <div className="h-[calc(100dvh-3.75rem)] text-white md:h-[calc(100dvh-4.25rem)]">
    <div className="mx-auto max-w-7xl px-6 pt-4 text-center max-md:sr-only">
      <h1 className="font-serif text-3xl leading-tight font-medium">
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-white/75">
        {copy.lead.map((sentence) => (
          <span key={sentence} className="block">
            {sentence}
          </span>
        ))}
      </p>
    </div>
  </div>
);

// `loading` takes no props, so each language gets its own lazy component
// with the placeholder's copy bound in. Created once at module load so the
// designer is not remounted on every render.
const loadDesigner = async () => {
  const module_ = await import("@/components/builder/designer");

  return module_.Designer;
};

const DESIGNERS = Object.fromEntries(
  LOCALES.map((locale) => {
    const copy = getDictionary(locale).designer;
    const Loading = () => <Placeholder copy={copy} />;

    return [locale, dynamic(loadDesigner, { ssr: false, loading: Loading })];
  }),
) as Record<Locale, React.ComponentType<DesignerProperties>>;

const Designer = (properties: DesignerProperties) => {
  const LocalisedDesigner = DESIGNERS[properties.locale];

  return <LocalisedDesigner {...properties} />;
};

export { Designer };
