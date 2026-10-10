import Link from "next/link";
import { delay, LogoMark } from "@/components/nail-art";
import type { Dictionary, Locale, Page } from "@/content/dictionary";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  localePagePath,
} from "@/content/dictionary";

// The header, mobile dock and footer shared by every page, and the class
// strings the pages build their buttons and headings from.

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

// Section anchors on the home page; from another page they go via its path.
const anchor = (home: string, id: string) => `${home}#${id}`;

const Header = ({
  locale,
  page,
  nav,
}: Readonly<{ locale: Locale; page: Page; nav: Dictionary["nav"] }>) => {
  const otherLocale: Locale = locale === "et" ? "en" : "et";
  const home = localePagePath(locale, "home");
  const onHome = page === "home";
  const link = (id: string) => (onHome ? `#${id}` : anchor(home, id));

  return (
    <header className="sticky top-0 z-50 bg-burgundy-deep/90 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 md:py-4">
        {onHome ?
          <a href="#top" aria-label="Lumora Nail Lounge">
            <Wordmark />
          </a>
        : <Link href={home} aria-label="Lumora Nail Lounge">
            <Wordmark />
          </Link>
        }
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a
            href={link("sinu-aeg")}
            className="transition-colors hover:text-rose"
          >
            {nav.time}
          </a>
          <a
            href={link("instagram")}
            className="transition-colors hover:text-rose"
          >
            {nav.instagram}
          </a>
          <a href={link("kkk")} className="transition-colors hover:text-rose">
            {nav.faq}
          </a>
          <Link
            href={localePagePath(locale, "designer")}
            aria-current={page === "designer" ? "page" : undefined}
            className={`transition-colors hover:text-rose ${page === "designer" ? "text-rose" : ""}`}
          >
            {nav.designer}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={localePagePath(otherLocale, page)}
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
            href={link("kontakt")}
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
const MobileDock = ({
  locale,
  page,
  nav,
}: Readonly<{ locale: Locale; page: Page; nav: Dictionary["nav"] }>) => {
  const home = localePagePath(locale, "home");
  const link = (id: string) => (page === "home" ? `#${id}` : anchor(home, id));

  return (
    <nav
      aria-label={nav.dockLabel}
      className="rise fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden"
      style={delay(1.4)}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full bg-burgundy-deep/95 p-1.5 pl-3 text-[0.7rem] font-semibold text-white shadow-xl shadow-burgundy-deep/40 backdrop-blur-md">
        <a href={link("sinu-aeg")} className="px-1.5 py-2.5">
          {nav.time}
        </a>
        <a href={link("instagram")} className="px-1.5 py-2.5">
          {nav.instagram}
        </a>
        <a href={link("kkk")} className="px-1.5 py-2.5">
          {nav.faq}
        </a>
        <Link
          href={localePagePath(locale, "designer")}
          className="px-1.5 py-2.5"
        >
          {nav.designer}
        </Link>
        <a
          href={link("kontakt")}
          className="rounded-full bg-rose px-3.5 py-2.5 text-burgundy-deep"
        >
          {nav.contact}
        </a>
      </div>
    </nav>
  );
};

const Footer = ({
  footer,
  compact = false,
}: Readonly<{ footer: Dictionary["footer"]; compact?: boolean }>) => (
  <footer
    className={`overflow-hidden bg-burgundy-deep text-white/60 ${compact ? "py-8" : "pt-16 pb-24 md:pt-20 md:pb-0"}`}
  >
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
      {!compact && (
        /* The negative margin swallows only the empty line space under the
           letters (measured for Cormorant), so the word sits flush on the page
           edge without being clipped, even during overscroll. */
        <p
          aria-hidden="true"
          className="mt-8 -mb-[0.165em] text-center font-serif text-[27vw] leading-none font-medium text-rose-soft select-none lg:text-[16rem]"
        >
          Lumora
        </p>
      )}
    </div>
  </footer>
);

export {
  eyebrow,
  Footer,
  Header,
  InstagramIcon,
  MobileDock,
  roseButton,
  roseButtonBase,
  sectionTitle,
  Wordmark,
};
