import Link from "next/link";
import Accordion from "@/components/accordion";
import HeroScene from "@/components/hero-scene";
import { BadgeRing, delay, LogoMark, NailGlyph } from "@/components/nail-art";
import type { Dictionary, Locale, PerkKind } from "@/content/dictionary";
import {
  getDictionary,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
} from "@/content/dictionary";

const MAP_SOURCE =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d151614.12249171216!2d24.60637007581068!3d59.48269761665056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x469294b4763fb4c7%3A0x500b36d18fc70f0!2sKesklinn%2C%20Tallinn!5e0!3m2!1sen!2see!4v1791322144284!5m2!1sen!2see";

// Display and padding are left out so callers can vary them without clashes.
const roseButtonBase =
  "items-center justify-center rounded-full bg-rose text-sm font-semibold tracking-wide text-burgundy-deep transition-colors hover:bg-rose-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose";

const roseButton = `inline-flex px-7 py-4 ${roseButtonBase}`;

const eyebrow = "text-[0.7rem] font-semibold tracking-[0.3em] uppercase";

const sectionTitle =
  "font-serif text-4xl leading-[1.05] font-medium sm:text-5xl";

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="size-4"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const Wordmark = () => (
  <span className="flex items-center gap-2.5">
    <LogoMark className="size-9" />
    <span className="flex flex-col leading-none">
      <span className="font-serif text-2xl font-medium tracking-wide">
        Lumora
      </span>
      <span className="mt-1 text-[0.55rem] tracking-[0.38em] text-rose uppercase">
        Nail Lounge
      </span>
    </span>
  </span>
);

const Header = ({
  locale,
  nav,
}: Readonly<{ locale: Locale; nav: Dictionary["nav"] }>) => {
  const otherLocale: Locale = locale === "et" ? "en" : "et";

  return (
    <header className="sticky top-0 z-50 bg-burgundy-deep/90 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 md:py-4">
        <a href="#top" aria-label="Lumora Nail Lounge">
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#sinu-aeg" className="transition-colors hover:text-rose">
            {nav.time}
          </a>
          <a href="#instagram" className="transition-colors hover:text-rose">
            {nav.instagram}
          </a>
          <a href="#kkk" className="transition-colors hover:text-rose">
            {nav.faq}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={otherLocale === "en" ? "/en/" : "/"}
            hrefLang={otherLocale}
            aria-label={nav.switchLabel}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold tracking-widest transition-colors hover:border-rose"
          >
            <span className={locale === "et" ? "text-white" : "text-white/45"}>
              ET
            </span>
            <span className="text-rose">/</span>
            <span className={locale === "en" ? "text-white" : "text-white/45"}>
              EN
            </span>
          </Link>
          <a
            href="#kontakt"
            className={`${roseButtonBase} hidden px-5 py-2.5 md:inline-flex`}
          >
            {nav.contact}
          </a>
        </div>
      </div>
    </header>
  );
};

// Thumb-reach navigation for phones; the header carries it from md up.
const MobileDock = ({ nav }: Readonly<{ nav: Dictionary["nav"] }>) => (
  <nav
    aria-label={nav.dockLabel}
    className="rise fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden"
    style={delay(1.4)}
  >
    <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full bg-burgundy-deep/95 p-1.5 pl-3 text-xs font-semibold text-white shadow-xl shadow-burgundy-deep/40 backdrop-blur-md">
      <a href="#sinu-aeg" className="px-2 py-2.5">
        {nav.time}
      </a>
      <a href="#instagram" className="px-2 py-2.5">
        {nav.instagram}
      </a>
      <a href="#kkk" className="px-2 py-2.5">
        {nav.faq}
      </a>
      <a
        href="#kontakt"
        className="rounded-full bg-rose px-4 py-2.5 text-burgundy-deep"
      >
        {nav.contact}
      </a>
    </div>
  </nav>
);

const Hero = ({ hero }: Readonly<{ hero: Dictionary["hero"] }>) => (
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
        <HeroScene className="block w-full text-rose" />
        <div
          className="rise absolute -bottom-7 -left-5 size-24 rounded-full bg-rose p-1.5 shadow-xl shadow-burgundy-deep/50 sm:size-28"
          style={delay(1.6)}
        >
          <BadgeRing text="Lumora · Nail Lounge · Tallinn · " />
        </div>
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

const Intro = ({ intro }: Readonly<{ intro: Dictionary["intro"] }>) => (
  <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-8 md:grid md:grid-cols-[1fr_1.2fr] md:gap-14 md:pt-28 md:pb-24">
    <div className="reveal">
      <p className={`${eyebrow} text-rose`}>{intro.eyebrow}</p>
      <h2 className={`mt-4 ${sectionTitle} text-ink`}>{intro.title}</h2>
    </div>
    <div className="reveal mt-6 md:mt-0 md:self-end">
      <p className="text-lg leading-relaxed text-plum">{intro.text}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {intro.highlights.map((highlight) => (
          <li
            key={highlight}
            className="flex items-center gap-2 rounded-full border border-rose/50 px-4 py-2 text-sm text-ink"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-rose"
            />
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

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
  <section id="sinu-aeg" className="scroll-mt-16 pb-20 md:pb-28">
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

const Faq = ({ faq }: Readonly<{ faq: Dictionary["faq"] }>) => (
  <section id="kkk" className="scroll-mt-16 py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-16">
      <div className="reveal lg:sticky lg:top-28 lg:self-start">
        <p className={`${eyebrow} text-rose`}>{faq.eyebrow}</p>
        <h2 className={`mt-4 ${sectionTitle} text-ink`}>{faq.title}</h2>
      </div>
      <div className="mt-10 lg:mt-0">
        <Accordion items={faq.items} />
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
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl rounded-tl-lg border border-rose"
          />
          <div className="relative overflow-hidden rounded-3xl rounded-tl-lg bg-burgundy-deep">
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

const Footer = ({ footer }: Readonly<{ footer: Dictionary["footer"] }>) => (
  <footer className="overflow-hidden bg-burgundy-deep pt-16 pb-24 text-white/60 md:pt-20 md:pb-0">
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-end sm:justify-between">
        <p>{footer.tagline}</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2 transition-colors hover:text-rose"
        >
          <InstagramIcon />@{INSTAGRAM_HANDLE}
        </a>
        <p>
          © {new Date().getFullYear()} Lumora Nail Lounge. {footer.rights}
        </p>
      </div>
      {/* The negative margin swallows only the empty line space under the
          letters (measured for Cormorant), so the word sits flush on the page
          edge without being clipped, even during overscroll. */}
      <p
        aria-hidden="true"
        className="mt-8 -mb-[0.165em] text-center font-serif text-[27vw] leading-none font-medium text-rose-soft select-none lg:text-[16rem]"
      >
        Lumora
      </p>
    </div>
  </footer>
);

const HomePage = ({ locale }: Readonly<{ locale: Locale }>) => {
  const dictionary = getDictionary(locale);

  return (
    <>
      <Header locale={locale} nav={dictionary.nav} />
      <main className="flex-1">
        <Hero hero={dictionary.hero} />
        <Marquee items={dictionary.marquee} />
        <Intro intro={dictionary.intro} />
        <Time time={dictionary.time} />
        <Instagram instagram={dictionary.instagram} />
        <Faq faq={dictionary.faq} />
        <Visit visit={dictionary.visit} />
      </main>
      <Footer footer={dictionary.footer} />
      <MobileDock nav={dictionary.nav} />
    </>
  );
};

export default HomePage;
