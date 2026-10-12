import Link from "next/link";
import { HeaderMenu } from "@/components/header-menu";
import { LogoMark } from "@/components/nail-art";
import type { Dictionary, Locale, Page } from "@/content/dictionary";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  localePagePath,
} from "@/content/dictionary";

// The header and footer shared by every page, and the class
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

// The designer link beckons: a rose pill with a breathing glow and a shine
// sweeping across it, which rests once the designer is the current page.
const designerLink = (current: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border border-rose px-4 py-1.5 text-sm font-semibold text-rose-soft transition-colors hover:bg-rose hover:text-burgundy-deep ${current ? "bg-rose/25" : "beckon bg-rose/10"}`;

const Sparkle = ({ className }: Readonly<{ className?: string }>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={`size-3.5 ${className ?? "text-rose"}`}
  >
    <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />
  </svg>
);

const LocaleSwitch = ({
  locale,
  page,
  label,
}: Readonly<{ locale: Locale; page: Page; label: string }>) => {
  const otherLocale: Locale = locale === "et" ? "en" : "et";

  return (
    <Link
      href={localePagePath(otherLocale, page)}
      hrefLang={otherLocale}
      aria-label={label}
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
  );
};

// The desktop header is three columns so the navigation sits on the page's
// centre line, whatever the wordmark and buttons beside it measure. On
// phones the navigation and the locale switch move into the hamburger
// menu.
const Header = ({
  locale,
  page,
  nav,
}: Readonly<{ locale: Locale; page: Page; nav: Dictionary["nav"] }>) => {
  const home = localePagePath(locale, "home");
  const onHome = page === "home";
  const link = (id: string) => (onHome ? `#${id}` : anchor(home, id));
  const onDesigner = page === "designer";
  const designer = localePagePath(locale, "designer");
  const sections = [
    { id: "sinu-aeg", label: nav.time },
    { id: "instagram", label: nav.instagram },
    { id: "kkk", label: nav.faq },
  ];

  return (
    <header className="sticky top-0 z-50 bg-burgundy-deep/90 text-white backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr] md:py-4">
        {onHome ?
          <a
            href="#top"
            aria-label="Lumora Nail Lounge"
            className="justify-self-start"
          >
            <Wordmark />
          </a>
        : <Link
            href={home}
            aria-label="Lumora Nail Lounge"
            className="justify-self-start"
          >
            <Wordmark />
          </Link>
        }
        <nav className="hidden items-center gap-8 justify-self-center text-sm md:flex">
          {sections.map((section) => (
            <a
              key={section.id}
              href={link(section.id)}
              className="transition-colors hover:text-rose"
            >
              {section.label}
            </a>
          ))}
          <Link
            href={designer}
            aria-current={onDesigner ? "page" : undefined}
            className={designerLink(onDesigner)}
          >
            <Sparkle />
            {nav.designer}
          </Link>
        </nav>
        <div className="hidden items-center gap-4 justify-self-end md:flex">
          <LocaleSwitch locale={locale} page={page} label={nav.switchLabel} />
          <a
            href={link("kontakt")}
            className={`${roseButtonBase} inline-flex px-5 py-2.5`}
          >
            {nav.contact}
          </a>
        </div>
        <HeaderMenu label={nav.menuLabel}>
          <nav
            aria-label={nav.menuLabel}
            className="flex flex-col gap-1 px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-base"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={link(section.id)}
                className="rounded-xl px-3 py-3 transition-colors hover:bg-white/5 hover:text-rose"
              >
                {section.label}
              </a>
            ))}
            <Link
              href={designer}
              aria-current={onDesigner ? "page" : undefined}
              className={`${designerLink(onDesigner)} mt-1 w-fit px-5 py-2.5 text-base`}
            >
              <Sparkle />
              {nav.designer}
            </Link>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <a
                href={link("kontakt")}
                className={`${roseButtonBase} inline-flex px-5 py-2.5`}
              >
                {nav.contact}
              </a>
              <LocaleSwitch
                locale={locale}
                page={page}
                label={nav.switchLabel}
              />
            </div>
          </nav>
        </HeaderMenu>
      </div>
    </header>
  );
};

// The footer links to the site's pages, with the current one marked.
const FooterLinks = ({
  footer,
  locale,
  page,
}: Readonly<{ footer: Dictionary["footer"]; locale: Locale; page: Page }>) => {
  const pages: { page: Page; label: string }[] = [
    { page: "home", label: footer.home },
    { page: "designer", label: footer.designer },
  ];

  return (
    <nav aria-label={footer.home} className="flex flex-wrap gap-x-5 gap-y-1">
      {pages.map((entry) => (
        <Link
          key={entry.page}
          href={localePagePath(locale, entry.page)}
          aria-current={entry.page === page ? "page" : undefined}
          className={`transition-colors hover:text-rose ${entry.page === page ? "text-white/90" : ""}`}
        >
          {entry.label}
        </Link>
      ))}
    </nav>
  );
};

const Footer = ({
  footer,
  locale,
  page,
  compact = false,
}: Readonly<{
  footer: Dictionary["footer"];
  locale: Locale;
  page: Page;
  compact?: boolean;
}>) => (
  <footer
    className={`overflow-hidden bg-burgundy-deep text-white/60 ${compact ? "py-8" : "pt-16 md:pt-20"}`}
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p>{footer.tagline}</p>
          <FooterLinks footer={footer} locale={locale} page={page} />
        </div>
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
  roseButton,
  roseButtonBase,
  sectionTitle,
  Sparkle,
  Wordmark,
};
