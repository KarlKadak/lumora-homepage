import type { Metadata } from "next";
import type { Locale, Page } from "@/content/dictionary";
import {
  getDictionary,
  localePagePath,
  LOCALES,
  localeUrl,
  SITE_NAME,
  SITE_URL,
} from "@/content/dictionary";

// Open Graph locale codes for the share card; the images live in public/.
const OG_LOCALE: Record<Locale, string> = { et: "et_EE", en: "en_GB" };

// Estonian is the default for visitors whose language the site does not serve.
const DEFAULT_LOCALE: Locale = "et";

const languageAlternates = (page: Page): Record<string, string> => {
  const entries: [string, string][] = LOCALES.map((locale) => [
    locale,
    localePagePath(locale, page),
  ]);

  return Object.fromEntries([
    ...entries,
    ["x-default", localePagePath(DEFAULT_LOCALE, page)],
  ]);
};

// The designer shares the home page's share card.
const buildMetadata = (locale: Locale, page: Page = "home"): Metadata => {
  const dictionary = getDictionary(locale);
  const meta = page === "home" ? dictionary.meta : dictionary.designer.meta;
  const image = `/og-${locale}.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: localePagePath(locale, page),
      languages: languageAlternates(page),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map(
        (other) => OG_LOCALE[other],
      ),
      url: localeUrl(locale, page),
      title: meta.title,
      description: meta.description,
      images: [
        { url: image, width: 1200, height: 630, alt: dictionary.meta.ogAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [{ url: image, alt: dictionary.meta.ogAlt }],
    },
    robots: { index: true, follow: true },
  };
};

export { buildMetadata };
