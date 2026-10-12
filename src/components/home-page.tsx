import Link from "next/link";
import Accordion from "@/components/accordion";
import HeroScene from "@/components/hero-scene";
import { BadgeRing, delay, NailGlyph } from "@/components/nail-art";
import { FINISHES, FinishSwatch } from "@/components/nail-finishes";
import { LocalBusinessSchema } from "@/components/schema";
import {
  eyebrow,
  Footer,
  Header,
  InstagramIcon,
  roseButton,
  sectionTitle,
  Sparkle,
} from "@/components/site-chrome";
import type { Dictionary, Locale, PerkKind } from "@/content/dictionary";
import {
  getDictionary,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  localePagePath,
} from "@/content/dictionary";

const MAP_SOURCE =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d151614.12249171216!2d24.60637007581068!3d59.48269761665056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x469294b4763fb4c7%3A0x500b36d18fc70f0!2sKesklinn%2C%20Tallinn!5e0!3m2!1sen!2see!4v1791322144284!5m2!1sen!2see";

const Hero = ({
  hero,
  locale,
}: Readonly<{ hero: Dictionary["hero"]; locale: Locale }>) => (
  <section
    id="top"
    className="relative bg-burgundy bg-[radial-gradient(ellipse_at_70%_35%,var(--color-burgundy)_0%,var(--color-burgundy)_30%,var(--color-burgundy-deep)_100%)] pb-24 text-white md:pb-32"
  >
    <div className="mx-auto grid max-w-6xl gap-y-10 px-4 pt-10 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-x-14 md:pt-20">
      <div className="md:self-end">
        <p className={`rise ${eyebrow} text-rose`} style={delay(0)}>
          {hero.eyebrow}
        </p>
        <h1
          className="rise mt-5 font-serif text-[3.1rem] leading-[0.98] font-medium sm:text-6xl lg:text-7xl"
          style={delay(0.1)}
        >
          {hero.titleStart}{" "}
          <em className="font-normal whitespace-nowrap text-rose">
            {hero.titleAccent}
          </em>
          <br />
          {hero.titleEnd}
        </h1>
      </div>

      <div className="relative mx-auto w-[min(84vw,24rem)] md:row-span-2 md:w-full md:max-w-lg md:self-center">
        <HeroScene
          className="w-full text-rose"
          picker={hero.picker}
          designerHref={localePagePath(locale, "designer")}
        />
        <Link
          href={localePagePath(locale, "designer")}
          aria-label={hero.designer}
          className="rise absolute -bottom-7 -left-5 block size-24 rounded-full bg-rose p-1.5 shadow-xl shadow-burgundy-deep/50 transition-colors hover:bg-rose-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose sm:size-28"
          style={delay(1.6)}
        >
          <BadgeRing text={hero.badge} />
        </Link>
      </div>

      <div className="md:self-start">
        <p
          className="rise max-w-md text-base leading-relaxed text-white/80 sm:text-lg"
          style={delay(0.25)}
        >
          {hero.lead}
        </p>
        <div
          className="rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={delay(0.35)}
        >
          <a href="#kontakt" className={roseButton}>
            {hero.primary}
          </a>
          <a
            href="#instagram"
            className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-4 text-sm font-semibold tracking-wide transition-colors hover:border-rose hover:text-rose"
          >
            {hero.secondary}
          </a>
        </div>
        <Link
          href={localePagePath(locale, "designer")}
          className="rise group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-soft transition-colors hover:text-rose"
          style={delay(0.5)}
        >
          <Sparkle />
          <span className="underline decoration-rose/50 underline-offset-4 group-hover:decoration-rose">
            {hero.designer}
          </span>
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  </section>
);

// Each half of the marquee repeats the items so it outspans ultrawide screens;
// the animation duration in globals.css scales with this count.
const MARQUEE_REPEATS = 6;

const Marquee = ({ items }: Readonly<{ items: string[] }>) => {
  const repeated = Array.from({ length: MARQUEE_REPEATS }, (_, round) =>
    items.map((item) => ({ item, key: `${item}-${String(round)}` })),
  ).flat();

  const renderItems = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? "true" : undefined}
    >
      {repeated.map(({ item, key }, index) => (
        <li
          key={key}
          className="flex items-center"
          aria-hidden={!hidden && index >= items.length ? "true" : undefined}
        >
          <span className="px-6 font-serif text-2xl italic sm:px-8 sm:text-3xl">
            {item}
          </span>
          <NailGlyph className="h-5 w-auto fill-burgundy-deep" />
        </li>
      ))}
    </ul>
  );

  // Tilted band laid across the seam between the hero and the next section.
  // The tilt flattens on wide screens so the band's ends never rise more than
  // 1.5rem off centre, keeping the seam covered edge to edge.
  return (
    <div className="relative z-10 -mt-[2.125rem] overflow-x-clip">
      <div className="-mx-[5%] rotate-[calc(-1*min(2deg,atan2(1.5rem,50vw)))] bg-rose py-4 text-burgundy-deep shadow-lg shadow-burgundy-deep/20">
        <div className="flex w-max animate-marquee">
          {renderItems(false)}
          {renderItems(true)}
        </div>
      </div>
    </div>
  );
};

// The invitation to the nail designer: what it does in four steps, a row of
// sample finishes and the way in. The swatches borrow the hero's shared
// polish definitions, which the hero drawing puts in the document.
const Promo = ({
  promo,
  locale,
}: Readonly<{ promo: Dictionary["promo"]; locale: Locale }>) => {
  const samples = promo.samples.flatMap((name) => {
    const finish = FINISHES.find((candidate) => candidate.name === name);

    return finish ? [finish] : [];
  });

  return (
    <section
      id="kujundaja"
      className="scroll-mt-16 bg-burgundy-deep py-20 text-white md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div className="reveal">
          <p className={`${eyebrow} text-rose`}>{promo.eyebrow}</p>
          <h2 className={`mt-4 ${sectionTitle}`}>
            {promo.titleStart}{" "}
            <em className="font-normal text-rose">{promo.titleAccent}</em>
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/80">
            {promo.text}
          </p>
          <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {promo.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-rose pt-px font-serif text-[1.75rem] leading-none font-medium text-rose lining-nums">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 leading-relaxed text-white/70">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={localePagePath(locale, "designer")}
              className={`${roseButton} beckon w-full gap-2 sm:w-auto`}
            >
              <Sparkle className="text-burgundy-deep" />
              {promo.cta}
            </Link>
            <p className="text-sm text-white/60">{promo.note}</p>
          </div>
        </div>
        <Link
          href={localePagePath(locale, "designer")}
          aria-label={promo.cta}
          className="reveal group mt-14 block rounded-[2rem] rounded-tl-[5rem] rounded-br-[5rem] bg-burgundy p-8 text-rose transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose sm:p-12 lg:mt-0"
        >
          <ul className="flex items-end justify-center gap-2 sm:gap-4">
            {samples.map((finish, index) => (
              <li
                key={finish.name}
                className="w-[16%] transition-transform duration-300 group-hover:-translate-y-2"
                style={{
                  transitionDelay: `${String(index * 40)}ms`,
                  marginBottom: `${String(Math.abs(index - 2) * 10)}%`,
                }}
              >
                <FinishSwatch finish={finish} className="w-full" />
              </li>
            ))}
          </ul>
        </Link>
      </div>
    </section>
  );
};

// Logo tiles. Netflix's N (from Simple Icons) keeps its brand red on black,
// as Netflix's guidelines ask; the parking tile is the familiar blue P sign.
const PerkLogo = ({ kind }: Readonly<{ kind: PerkKind }>) => {
  switch (kind) {
    case "netflix": {
      return (
        <span className="flex size-16 items-center justify-center rounded-2xl bg-black shadow-lg shadow-burgundy-deep/15">
          <svg viewBox="0 0 24 24" className="size-9" role="img">
            <title>Netflix</title>
            <path
              fill="#e50914"
              d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z"
            />
          </svg>
        </span>
      );
    }
    case "parking": {
      return (
        <span className="flex size-16 overflow-hidden rounded-2xl shadow-lg shadow-burgundy-deep/15">
          <svg viewBox="0 0 48 48" className="size-full" role="img">
            <title>Parking</title>
            <rect width="48" height="48" rx="10" fill="#0057a8" />
            <rect
              x="3"
              y="3"
              width="42"
              height="42"
              rx="7.5"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              fill="white"
              fillRule="evenodd"
              d="M16 10H27A8 8 0 0 1 27 26H22V38H16Z M22 15V21H27A3 3 0 0 0 27 15Z"
            />
          </svg>
        </span>
      );
    }
    case "calm": {
      return (
        <span className="flex size-16 items-center justify-center rounded-2xl bg-rose shadow-lg shadow-burgundy-deep/15">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-10 text-burgundy-deep"
            aria-hidden="true"
          >
            <path d="M11 21h22v5a11 11 0 0 1-22 0z" />
            <path d="M33 23h2.5a4.5 4.5 0 0 1 0 9H32" />
            <path d="M18 9c-1.5 2 1.5 3.5 0 6M24 9c-1.5 2 1.5 3.5 0 6" />
            <path d="M9 41h26" />
          </svg>
        </span>
      );
    }
  }
};

const Time = ({ time }: Readonly<{ time: Dictionary["time"] }>) => (
  <section id="sinu-aeg" className="scroll-mt-16 pt-20 pb-20 md:pt-28 md:pb-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="reveal max-w-xl">
        <p className={`${eyebrow} text-rose`}>{time.eyebrow}</p>
        <h2 className={`mt-4 ${sectionTitle} text-ink`}>{time.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-plum">{time.text}</p>
      </div>
      <ul className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
        {time.items.map((item) => (
          <li
            key={item.kind}
            className="reveal relative flex flex-col overflow-hidden rounded-[2rem] rounded-tl-[4.5rem] rounded-br-[4.5rem] bg-pearl p-7 pt-9 transition-transform duration-300 hover:-translate-y-1.5"
          >
            <NailGlyph className="absolute -right-3 -bottom-12 h-44 w-auto rotate-[18deg] fill-none stroke-rose/25 stroke-[1.5]" />
            <PerkLogo kind={item.kind} />
            <h3 className="mt-8 font-serif text-3xl text-ink">{item.title}</h3>
            <p className="relative mt-3 leading-relaxed text-plum">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

// Instagram's profile embed: header plus a grid of the six latest posts. The
// iframe cannot report its height, so EMBED_HEIGHT mirrors its layout: two
// rows of square tiles (two thirds of the card's width) under a header that
// grows by 11px once the frame is wider than 480px (the step is clamp() over
// a huge multiplier). It ends at the grid, cutting off the embed's "View full
// profile" footer (the follow button beside it links there), and scrolling is
// off so the footer stays hidden. The card's smaller top-right radius follows
// the curve of Instagram's logo in that corner.
const EMBED_HEIGHT =
  "calc(100cqw * 2 / 3 + 146.5px + clamp(0px, (100cqw - 480px) * 1000, 11px))";

const Instagram = ({
  instagram,
}: Readonly<{ instagram: Dictionary["instagram"] }>) => (
  <section id="instagram" className="scroll-mt-16 bg-pearl py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-16">
      <div className="reveal lg:sticky lg:top-28 lg:self-start">
        <p className={`${eyebrow} text-rose`}>{instagram.eyebrow}</p>
        <h2 className={`mt-4 ${sectionTitle} text-ink`}>{instagram.title}</h2>
        <p className="mt-4 max-w-sm leading-relaxed text-plum">
          {instagram.text}
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${roseButton} mt-8 w-full gap-2 sm:w-auto`}
        >
          <InstagramIcon />
          {instagram.follow}
        </a>
      </div>
      <div className="reveal @container mt-12 overflow-hidden rounded-[2rem] rounded-tl-[5rem] rounded-tr-2xl rounded-br-[5rem] bg-white lg:mt-0">
        <iframe
          src={`${INSTAGRAM_URL}embed/`}
          title={instagram.embedTitle}
          className="block w-full border-0"
          style={{ height: EMBED_HEIGHT }}
          loading="eager"
          // Obsolete but supported everywhere, and the only way to stop a
          // cross-origin page from scrolling.
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          scrolling="no"
        />
      </div>
    </div>
  </section>
);

const Faq = ({
  faq,
  locale,
}: Readonly<{ faq: Dictionary["faq"]; locale: Locale }>) => (
  <section id="kkk" className="scroll-mt-16 py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-16">
      <div className="reveal lg:sticky lg:top-28 lg:self-start">
        <p className={`${eyebrow} text-rose`}>{faq.eyebrow}</p>
        <h2 className={`mt-4 ${sectionTitle} text-ink`}>{faq.title}</h2>
      </div>
      <div className="mt-10 lg:mt-0">
        <Accordion items={faq.items} locale={locale} />
      </div>
    </div>
  </section>
);

const Visit = ({ visit }: Readonly<{ visit: Dictionary["visit"] }>) => {
  return (
    <section
      id="kontakt"
      className="scroll-mt-16 bg-burgundy py-20 text-white md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-8 lg:grid-cols-[1fr_1.25fr] lg:items-center">
        <div className="reveal">
          <p className={`${eyebrow} text-rose`}>{visit.eyebrow}</p>
          <h2 className={`mt-4 ${sectionTitle}`}>
            {visit.titleStart}{" "}
            <em className="font-normal text-rose">{visit.titleAccent}</em>
          </h2>
          <dl className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <dt className={`${eyebrow} text-white/50`}>
                {visit.addressLabel}
              </dt>
              <dd className="mt-3 leading-relaxed">
                {visit.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className={`${eyebrow} text-white/50`}>
                {visit.openingLabel}
              </dt>
              <dd className="mt-3 leading-relaxed">{visit.opening}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className={`${eyebrow} text-white/50`}>
                {visit.contactLabel}
              </dt>
              <dd className="mt-3 flex flex-col gap-1">
                <a
                  href={`mailto:${visit.email}`}
                  className="w-fit break-all transition-colors hover:text-rose"
                >
                  {visit.email}
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit transition-colors hover:text-rose"
                >
                  @{INSTAGRAM_HANDLE}
                </a>
              </dd>
            </div>
          </dl>
          <a
            href={`mailto:${visit.email}`}
            className={`${roseButton} mt-10 w-full sm:w-auto`}
          >
            {visit.cta}
          </a>
        </div>
        <div className="reveal relative mr-3 mb-3">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-lg border border-rose"
          />
          <div className="relative overflow-hidden rounded-lg bg-burgundy-deep">
            <iframe
              src={MAP_SOURCE}
              title={visit.mapTitle}
              className="block aspect-square w-full border-0 sm:aspect-4/3"
              allowFullScreen
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = ({ locale }: Readonly<{ locale: Locale }>) => {
  const dictionary = getDictionary(locale);

  return (
    <>
      <LocalBusinessSchema locale={locale} meta={dictionary.meta} />
      <Header locale={locale} page="home" nav={dictionary.nav} />
      <main className="flex-1">
        <Hero hero={dictionary.hero} locale={locale} />
        <Marquee items={dictionary.marquee} />
        <Time time={dictionary.time} />
        <Promo promo={dictionary.promo} locale={locale} />
        <Instagram instagram={dictionary.instagram} />
        <Faq faq={dictionary.faq} locale={locale} />
        <Visit visit={dictionary.visit} />
      </main>
      <Footer footer={dictionary.footer} locale={locale} page="home" />
    </>
  );
};

export default HomePage;
