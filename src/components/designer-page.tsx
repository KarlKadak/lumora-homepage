import Link from "next/link";
import Accordion from "@/components/accordion";
import { Designer } from "@/components/builder/designer-client";
import { DesignerSchema, FaqSchema } from "@/components/schema";
import {
  eyebrow,
  Footer,
  Header,
  roseButton,
  sectionTitle,
} from "@/components/site-chrome";
import type { DesignerCopy, Locale } from "@/content/dictionary";
import { getDictionary, localePagePath } from "@/content/dictionary";

// The written guide under the designer: what the tool does, step by step,
// and the questions people ask about it. The designer itself only renders in
// the browser, so this is the page's readable content for search engines, and
// the way on to booking for anyone who scrolls past the workspace.
const Guide = ({
  guide,
  locale,
}: Readonly<{ guide: DesignerCopy["guide"]; locale: Locale }>) => (
  <section className="bg-white py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="reveal max-w-2xl">
        <p className={`${eyebrow} text-rose`}>{guide.eyebrow}</p>
        <h2 className={`mt-4 ${sectionTitle} text-ink`}>{guide.title}</h2>
        {guide.text.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-lg leading-relaxed text-plum">
            {paragraph}
          </p>
        ))}
      </div>
      <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 md:mt-16">
        {guide.steps.map((step, index) => (
          <li key={step.title} className="reveal flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-rose pt-px font-serif text-[1.75rem] leading-none font-medium text-rose lining-nums">
              {index + 1}
            </span>
            <div>
              <h3 className="font-serif text-2xl text-ink">{step.title}</h3>
              <p className="mt-1 leading-relaxed text-plum">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-20 lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <h2 className={`${sectionTitle} text-ink`}>{guide.faqTitle}</h2>
          <p className="mt-6 max-w-sm leading-relaxed text-plum">
            {guide.ctaNote}
          </p>
          <Link
            href={`${localePagePath(locale, "home")}#kontakt`}
            className={`${roseButton} mt-8 w-full sm:w-auto`}
          >
            {guide.cta}
          </Link>
        </div>
        <div className="mt-10 lg:mt-0">
          <Accordion items={guide.faq} locale={locale} />
        </div>
      </div>
    </div>
  </section>
);

// The nail designer page: the site header, the designer, its written guide
// and a compact footer.
const DesignerPage = ({ locale }: Readonly<{ locale: Locale }>) => {
  const dictionary = getDictionary(locale);

  return (
    <>
      <DesignerSchema locale={locale} meta={dictionary.designer.meta} />
      <FaqSchema items={dictionary.designer.guide.faq} />
      <Header locale={locale} page="designer" nav={dictionary.nav} />
      <main className="flex-1">
        <Designer locale={locale} copy={dictionary.designer} />
        <Guide guide={dictionary.designer.guide} locale={locale} />
      </main>
      <Footer
        footer={dictionary.footer}
        locale={locale}
        page="designer"
        compact
      />
    </>
  );
};

export default DesignerPage;
