import "../app/globals.css";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { IntroOverlay } from "@/components/nail-art";
import type { Locale } from "@/content/dictionary";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
});

// Runs before first paint: the intro animation plays once per browser tab, so
// switching language or reloading goes straight to the page. A plain inline
// script on purpose: next/script defers it past first paint. Only the static
// HTML needs to run it, so React's dev warning about client scripts is moot.
//
// On the first visit the marker is set later, once the intro and the hero
// entrance have both finished. Client-side navigation (designer to home in
// the same locale) keeps the document, so without this a session that
// started on the designer would land on the hero with the full intro wait and
// no intro on screen. The delay must outlast the hero entrance, or shortening
// --hero-delay would make animations still in flight jump to their end.
const INTRO_SCRIPT = `try{var d=document.documentElement,k="lumora-intro";if(sessionStorage.getItem(k)){d.dataset.intro="seen"}else{sessionStorage.setItem(k,"1");setTimeout(function(){d.dataset.intro="seen"},6000)}}catch(_){}`;

// Each language is its own root layout so that <html lang> is correct in the
// static export; both render through this shared shell.
const RootDocument = ({
  locale,
  children,
}: Readonly<{ locale: Locale; children: React.ReactNode }>) => (
  <html
    lang={locale}
    className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    data-scroll-behavior="smooth"
    suppressHydrationWarning
  >
    <body className="flex min-h-full flex-col font-sans">
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <IntroOverlay />
      {children}
    </body>
  </html>
);

export default RootDocument;
