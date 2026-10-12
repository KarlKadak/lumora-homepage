import type { Dictionary, Locale, Question } from "@/content/dictionary";
import {
  EMAIL,
  INSTAGRAM_URL,
  localeUrl,
  SITE_NAME,
  SITE_URL,
} from "@/content/dictionary";

const SALON_ID = `${SITE_URL}/#salon`;

// "<" is escaped so the JSON can never close the script.
const JsonLd = ({ data }: Readonly<{ data: object }>) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
    }}
  />
);

// schema.org description of the salon for search engines. The street address
// and opening hours join once they are known; "Tallinn" is enough for local
// results until then.
const LocalBusinessSchema = ({
  locale,
  meta,
}: Readonly<{ locale: Locale; meta: Dictionary["meta"] }>) => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "NailSalon",
      "@id": SALON_ID,
      name: SITE_NAME,
      url: localeUrl(locale),
      description: meta.description,
      image: `${SITE_URL}/og-${locale}.png`,
      logo: `${SITE_URL}/icon.png`,
      email: EMAIL,
      sameAs: [INSTAGRAM_URL],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tallinn",
        addressCountry: "EE",
      },
      areaServed: { "@type": "City", name: "Tallinn" },
      inLanguage: locale,
    }}
  />
);

// The nail designer as a free in-browser tool offered by the salon. The
// designer only renders in the browser, so this tells crawlers what the page
// is even before the markup appears.
const DesignerSchema = ({
  locale,
  meta,
}: Readonly<{ locale: Locale; meta: Dictionary["designer"]["meta"] }>) => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${localeUrl(locale, "designer")}#app`,
      name: meta.title,
      description: meta.description,
      url: localeUrl(locale, "designer"),
      image: `${SITE_URL}/og-${locale}.png`,
      applicationCategory: "DesignApplication",
      browserRequirements: "Requires JavaScript",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      provider: {
        "@type": "NailSalon",
        "@id": SALON_ID,
        name: SITE_NAME,
        url: localeUrl(locale),
      },
      inLanguage: locale,
    }}
  />
);

// The designer page's questions and answers, so search results can show them.
const FaqSchema = ({ items }: Readonly<{ items: Question[] }>) => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    }}
  />
);

export { DesignerSchema, FaqSchema, LocalBusinessSchema };
