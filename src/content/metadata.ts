import type { Metadata } from "next";
import type { Locale } from "@/content/dictionary";
import {
  getDictionary,
  localePath,
  LOCALES,
  localeUrl,
  SITE_NAME,
  SITE_URL,
} from "@/content/dictionary";

// Open Graph locale codes for the share card; the images live in public/.
const OG_LOCALE: Record<Locale, string> = { et: "et_EE", en: "en_GB" };

// Estonian is the default for visitors whose language we do not serve.
const DEFAULT_LOCALE: Locale = "et";

const languageAlternates = (): Record<string, string> => {
  const entries: [string, string][] = LOCALES.map((locale) => [
    locale,
    localePath(locale),
  ]);

  return Object.fromEntries([
    ...entries,
    ["x-default", localePath(DEFAULT_LOCALE)],
  ]);
};

const buildMetadata = (locale: Locale): Metadata => {
  const { meta } = getDictionary(locale);
  const image = `/og-${locale}.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: localePath(locale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map(
        (other) => OG_LOCALE[other],
      ),
      url: localeUrl(locale),
      title: meta.title,
      description: meta.description,
      images: [{ url: image, width: 1200, height: 630, alt: meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [{ url: image, alt: meta.ogAlt }],
    },
    robots: { index: true, follow: true },
  };
};

export { buildMetadata };
