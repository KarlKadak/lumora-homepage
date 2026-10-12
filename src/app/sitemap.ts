import type { MetadataRoute } from "next";
import {
  type Locale,
  LOCALES,
  localeUrl,
  type Page,
} from "@/content/dictionary";

const PAGES: readonly Page[] = ["home", "designer"];

// Estonian is the default for visitors whose language the site does not serve, as in
// the pages' own hreflang links.
const DEFAULT_LOCALE: Locale = "et";

// Static export: Next writes this out as /sitemap.xml at build time. Each
// language page lists the others as alternates, mirroring the hreflang links.
const sitemap = (): MetadataRoute.Sitemap =>
  PAGES.flatMap((page) => {
    const entries: [string, string][] = LOCALES.map((locale) => [
      locale,
      localeUrl(locale, page),
    ]);
    const languages: Record<string, string> = Object.fromEntries([
      ...entries,
      ["x-default", localeUrl(DEFAULT_LOCALE, page)],
    ]);

    return LOCALES.map((locale) => ({
      url: localeUrl(locale, page),
      changeFrequency: "weekly" as const,
      priority:
        page === "home" ?
          locale === "et" ?
            1
          : 0.8
        : 0.7,
      alternates: { languages },
    }));
  });

// Metadata routes need force-static under output: "export". Next reads the
// value at compile time, so it has to be a direct named export.
export const dynamic = "force-static";

export default sitemap;
