type Locale = "et" | "en";

type PerkKind = "netflix" | "parking" | "calm";

interface Perk {
  kind: PerkKind;
  title: string;
  text: string;
}

interface Question {
  question: string;
  answer: string;
}

// The colour picker behind the hero's polish bottle. Finish names are keyed
// by the catalogue names in nail-finishes.tsx.
interface Picker {
  hint: string;
  title: string;
  text: string;
  random: string;
  close: string;
  newLabel: string;
  names: Record<string, string>;
}

interface Dictionary {
  meta: { title: string; description: string };
  nav: {
    instagram: string;
    time: string;
    faq: string;
    contact: string;
    switchLabel: string;
    dockLabel: string;
  };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    lead: string;
    primary: string;
    secondary: string;
    picker: Picker;
  };
  marquee: string[];
  intro: { eyebrow: string; title: string; text: string; highlights: string[] };
  time: { eyebrow: string; title: string; text: string; items: Perk[] };
  instagram: {
    eyebrow: string;
    title: string;
    text: string;
    follow: string;
    embedTitle: string;
  };
  faq: { eyebrow: string; title: string; items: Question[] };
  visit: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    addressLabel: string;
    address: string[];
    openingLabel: string;
    opening: string;
    contactLabel: string;
    email: string;
    cta: string;
    mapTitle: string;
  };
  footer: { tagline: string; rights: string };
}

const EMAIL = "isabel@lumorabeauty.ee";
const INSTAGRAM_HANDLE = "lumora.nail.lounge";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const et: Dictionary = {
  meta: {
    title: "Lumora Nail Lounge | Küünesalong Tallinnas",
    description:
      "Lumora Nail Lounge avab peagi uksed Tallinnas. Maniküür, geellakk, küünepikendused ja küünekunst.",
  },
  nav: {
    instagram: "Instagram",
    time: "Sinu aeg",
    faq: "KKK",
    contact: "Võta ühendust",
    switchLabel: "Switch to English",
    dockLabel: "Kiirlingid",
  },
  hero: {
    eyebrow: "Lumora Nail Lounge",
    titleStart: "Uus küünesalong",
    titleAccent: "Tallinnas",
    titleEnd: "avab peagi uksed.",
    lead: "Maniküür, geellakk, küünepikendused ja küünekunst. Avamise kuupäeva anname teada Instagramis.",
    primary: "Võta ühendust",
    secondary: "Jälgi Instagramis",
    picker: {
      hint: "Klõpsa pudelil ja vali värv",
      title: "Vali värv",
      text: "Küüned maalitakse sinu valitud tooniga. Juhuslik valik laseb pintslil ise edasi toimetada.",
      random: "Juhuslik",
      close: "Sulge",
      newLabel: "Uus",
      names: {
        halloween: "Halloween",
        "halloween-night": "Halloweeni öö",
        rose: "Roos",
        chrome: "Kroom",
        french: "Prantsuse",
        cherry: "Kirss",
        glitter: "Sädelus",
        sunset: "Loojang",
        polka: "Täpid",
        nude: "Nude",
        ombre: "Ombré",
        winter: "Talv",
        ink: "Tint",
        "cat-eye": "Kassisilm",
        leopard: "Leopard",
        lavender: "Lavendel",
        candy: "Komm",
        marble: "Marmor",
        sage: "Salvei",
        valentine: "Valentin",
        aurora: "Virmalised",
        "half-moon": "Poolkuu",
        "rose-soft": "Õrn roos",
        galaxy: "Galaktika",
        "gold-foil": "Kuldleht",
        holo: "Holo",
        festive: "Jõulud",
        ocean: "Ookean",
        stripes: "Triibud",
        pearl: "Pärl",
      },
    },
  },
  marquee: [
    "Maniküür",
    "Geellakk",
    "Küünepikendus",
    "BIAB tugevdus",
    "Küünekunst",
  ],
  intro: {
    eyebrow: "Meist",
    title: "Väike salong suure tähelepanuga detailidele.",
    text: "Töötame steriliseeritud instrumentidega, kasutame vegan- ja HEMA-vabu tooteid ning võtame iga kliendi jaoks aega. Olgu soov klassikaline nude, peen kroom või käsitsi maalitud muster, teeme selle nii, et oled tulemusega rahul.",
    highlights: [
      "Steriilsed instrumendid",
      "HEMA-vabad tooted",
      "Ainult broneeringuga",
    ],
  },
  time: {
    eyebrow: "Sinu aeg",
    title: "Aeg on sinu päralt.",
    text: "Kuni meie sinu küüntega tegeleme, võid aega veeta just nii, nagu soovid.",
    items: [
      {
        kind: "netflix",
        title: "Meelelahutus",
        text: "Meil on valik meelelahutust. Näiteks saad Netflixis oma lemmiksarja edasi vaadata.",
      },
      {
        kind: "calm",
        title: "Vaikus või vestlus",
        text: "Kui soovid, joo tass teed ja naudi vaikust. Kui tahad juttu ajada, ajame juttu.",
      },
      {
        kind: "parking",
        title: "Parkimine",
        text: "Klientidele on olemas parkimiskohad, nii et autoga tulla on lihtne.",
      },
    ],
  },
  instagram: {
    eyebrow: "Instagram",
    title: "Piilu kulisside taha.",
    text: "Postitame Instagrami uusi kujundusi, pilte salongi valmimisest ja avamise uudiseid.",
    follow: `Jälgi @${INSTAGRAM_HANDLE}`,
    embedTitle: "Lumora Nail Lounge'i Instagrami voog",
  },
  faq: {
    eyebrow: "KKK",
    title: "Küsimused enne avamist",
    items: [
      {
        question: "Millal te avate?",
        answer:
          "Avame peagi Tallinnas. Avamise kuupäeva anname esmalt teada Instagramis.",
      },
      {
        question: "Kuidas saan aja broneerida?",
        answer:
          "Kirjuta meile e-kiri. Võtame sinuga ühendust kohe, kui broneerimine avaneb.",
      },
      {
        question: "Milliseid teenuseid pakute?",
        answer:
          "Maniküüri, geellakki, küünepikendusi, BIAB tugevdust ja küünekunsti.",
      },
      {
        question: "Milliseid tooteid kasutate?",
        answer:
          "Vegan- ja HEMA-vabu tooteid ning töötame alati steriliseeritud instrumentidega.",
      },
    ],
  },
  visit: {
    eyebrow: "Leia meid",
    titleStart: "Avame uksed",
    titleAccent: "Tallinnas.",
    addressLabel: "Asukoht",
    address: ["Tallinn", "Täpne aadress selgub peagi"],
    openingLabel: "Avamine",
    opening: "Avame peagi. Jälgi Instagrami, siis kuuled sellest esimesena.",
    contactLabel: "Kontakt",
    email: EMAIL,
    cta: "Kirjuta meile",
    mapTitle: "Lumora Nail Lounge asukoht kaardil",
  },
  footer: {
    tagline: "Küünesalong Tallinnas.",
    rights: "Kõik õigused kaitstud.",
  },
};

const en: Dictionary = {
  meta: {
    title: "Lumora Nail Lounge | Nail salon in Tallinn",
    description:
      "Lumora Nail Lounge is opening soon in Tallinn. Manicures, gel polish, extensions and nail art.",
  },
  nav: {
    instagram: "Instagram",
    time: "Your time",
    faq: "FAQ",
    contact: "Get in touch",
    switchLabel: "Vaheta eesti keelele",
    dockLabel: "Quick links",
  },
  hero: {
    eyebrow: "Lumora Nail Lounge",
    titleStart: "A new nail salon",
    titleAccent: "in Tallinn",
    titleEnd: "opening soon.",
    lead: "Manicures, gel polish, extensions and nail art. We will announce the opening date on Instagram.",
    primary: "Get in touch",
    secondary: "Follow on Instagram",
    picker: {
      hint: "Click the bottle to pick a colour",
      title: "Pick a colour",
      text: "The nails are painted in the shade you choose. Random lets the brush carry on by itself.",
      random: "Random",
      close: "Close",
      newLabel: "New",
      names: {
        halloween: "Halloween",
        "halloween-night": "Halloween night",
        rose: "Rose",
        chrome: "Chrome",
        french: "French tip",
        cherry: "Cherry",
        glitter: "Glitter",
        sunset: "Sunset",
        polka: "Polka dots",
        nude: "Nude",
        ombre: "Ombré",
        winter: "Winter",
        ink: "Ink",
        "cat-eye": "Cat eye",
        leopard: "Leopard",
        lavender: "Lavender",
        candy: "Candy",
        marble: "Marble",
        sage: "Sage",
        valentine: "Valentine",
        aurora: "Aurora",
        "half-moon": "Half moon",
        "rose-soft": "Soft rose",
        galaxy: "Galaxy",
        "gold-foil": "Gold foil",
        holo: "Holo",
        festive: "Festive",
        ocean: "Ocean",
        stripes: "Stripes",
        pearl: "Pearl",
      },
    },
  },
  marquee: ["Manicure", "Gel polish", "Extensions", "BIAB overlay", "Nail art"],
  intro: {
    eyebrow: "About us",
    title: "A small salon with a big eye for detail.",
    text: "We work with sterilised tools, use vegan and HEMA-free products and never rush an appointment. Whether you want a classic nude, a subtle chrome or a hand-painted design, we make sure you are happy with the result.",
    highlights: [
      "Sterilised tools",
      "HEMA-free products",
      "By appointment only",
    ],
  },
  time: {
    eyebrow: "Your time",
    title: "The time is yours.",
    text: "While we work on your nails, you can spend the time however you like.",
    items: [
      {
        kind: "netflix",
        title: "Entertainment",
        text: "We have a selection of entertainment. You can, for example, carry on with your favourite series on Netflix.",
      },
      {
        kind: "calm",
        title: "Quiet or conversation",
        text: "If you like, have a cup of tea and enjoy the quiet. If you feel like talking, we are happy to chat.",
      },
      {
        kind: "parking",
        title: "Parking",
        text: "Parking spots are available for clients, so coming by car is easy.",
      },
    ],
  },
  instagram: {
    eyebrow: "Instagram",
    title: "A peek behind the scenes.",
    text: "We post new designs, photos of the salon coming together and opening news on Instagram.",
    follow: `Follow @${INSTAGRAM_HANDLE}`,
    embedTitle: "Lumora Nail Lounge Instagram feed",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions before we open",
    items: [
      {
        question: "When do you open?",
        answer:
          "We are opening soon in Tallinn. The opening date will be announced on Instagram first.",
      },
      {
        question: "How can I book an appointment?",
        answer:
          "Send us an email. We will get back to you as soon as bookings open.",
      },
      {
        question: "Which services do you offer?",
        answer:
          "Manicures, gel polish, extensions, BIAB overlays and nail art.",
      },
      {
        question: "Which products do you use?",
        answer:
          "Vegan and HEMA-free products, and we always work with sterilised tools.",
      },
    ],
  },
  visit: {
    eyebrow: "Find us",
    titleStart: "Opening our doors",
    titleAccent: "in Tallinn.",
    addressLabel: "Location",
    address: ["Tallinn", "Exact address coming soon"],
    openingLabel: "Opening",
    opening: "Opening soon. Follow us on Instagram to hear about it first.",
    contactLabel: "Contact",
    email: EMAIL,
    cta: "Email us",
    mapTitle: "Map showing the location of Lumora Nail Lounge",
  },
  footer: {
    tagline: "Nail lounge in Tallinn.",
    rights: "All rights reserved.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { et, en };

const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

export type { Dictionary, Locale, PerkKind, Picker, Question };

export { getDictionary, INSTAGRAM_HANDLE, INSTAGRAM_URL };
