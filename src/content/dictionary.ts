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
  classic: string;
  close: string;
  newLabel: string;
  names: Record<string, string>;
}

// Copy for the nail designer page.
interface DesignerCopy {
  meta: { title: string; description: string };
  title: string;
  // One sentence per line.
  lead: string[];
  hands: {
    right: string;
    left: string;
    both: string;
    copyOther: string;
    hint: string;
    formHint: string;
    label: string;
  };
  toolbar: {
    leftHand: string;
    hideMenu: string;
    showMenu: string;
    menu: string;
    close: string;
    undo: string;
    redo: string;
    reset: string;
    resetConfirm: string;
    confirm: string;
    cancel: string;
    download: string;
    share: string;
    copyLink: string;
    linkCopied: string;
    randomAll: string;
    random: string;
  };
  panels: {
    length: string;
    shape: string;
    sharpness: string;
    color: string;
    design: string;
  };
  presets: Record<Preset, string>;
  levelText: string;
  color: {
    custom: string;
    recent: string;
    finishes: string;
    polishes: string;
    applied: string;
    names: Record<string, string>;
  };
  design: {
    addElement: string;
    layers: string;
    patterns: string;
    illustrations: string;
    stones: string;
    selected: string;
    size: string;
    rotation: string;
    offset: string;
    color: string;
    color2: string;
    flip: string;
    duplicate: string;
    forward: string;
    back: string;
    delete: string;
    allNails: string;
    onlyThis: string;
    applyTo: string;
    done: string;
    empty: string;
    pick: string;
    // Arrows beside the nail editor that step through the hand's nails.
    previousNail: string;
    nextNail: string;
    elementLabel: string;
    elementHint: string;
  };
  fingers: Record<FingerName, string>;
  elements: Record<string, string>;
  stoneColors: Record<string, string>;
  export: {
    length: string;
    caption: string;
    failed: string;
    working: string;
    fileName: string;
  };
  nailButton: string;
  live: { length: string; shape: string; sharpness: string };
}

type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky";

type Preset =
  | "stiletto"
  | "softStiletto"
  | "almond"
  | "coffin"
  | "softCoffin"
  | "oval"
  | "square"
  | "squoval"
  | "round";

interface Dictionary {
  meta: { title: string; description: string; ogAlt: string };
  nav: {
    instagram: string;
    time: string;
    faq: string;
    designer: string;
    contact: string;
    switchLabel: string;
    menuLabel: string;
  };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    lead: string;
    primary: string;
    secondary: string;
    designer: string;
    // Repeated around the hero badge, which links to the designer.
    badge: string;
    picker: Picker;
  };
  marquee: string[];
  // The home page's invitation to the nail designer.
  promo: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    text: string;
    steps: { title: string; text: string }[];
    cta: string;
    note: string;
    // Finish names from the catalogue in nail-finishes.tsx, shown as a row of
    // sample nails.
    samples: string[];
  };
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
  designer: DesignerCopy;
}

const SITE_URL = "https://lumorabeauty.ee";
const SITE_NAME = "Lumora Nail Lounge";
const EMAIL = "isabel@lumorabeauty.ee";
const INSTAGRAM_HANDLE = "lumora.nail.lounge";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const et: Dictionary = {
  meta: {
    title: "Lumora Nail Lounge | Küünesalong Tallinnas",
    description:
      "Uus küünesalong Tallinnas avab peagi uksed. Maniküür, geellakk, küünepikendused, BIAB tugevdus ja küünekunst. Jälgi Instagramis avamisuudiseid.",
    ogAlt: "Lumora Nail Lounge – uus küünesalong Tallinnas avab peagi uksed",
  },
  nav: {
    instagram: "Instagram",
    time: "Sinu aeg",
    faq: "KKK",
    designer: "Kujunda",
    contact: "Võta ühendust",
    switchLabel: "Switch to English",
    menuLabel: "Menüü",
  },
  hero: {
    eyebrow: "Lumora Nail Lounge",
    titleStart: "Uus küünesalong",
    titleAccent: "Tallinnas",
    titleEnd: "avab peagi uksed.",
    lead: "Maniküür, geellakk, küünepikendused ja küünekunst. Avamise kuupäeva anname teada Instagramis.",
    primary: "Võta ühendust",
    secondary: "Jälgi Instagramis",
    designer: "Kujunda oma küüned",
    badge: "Kujunda oma küüned · ",
    picker: {
      hint: "Klõpsa pudelil ja vali värv",
      title: "Vali värv",
      text: "Küüned maalitakse sinu valitud tooniga. Klassika ja juhuslik valik lasevad pintslil ise edasi toimetada.",
      random: "Juhuslik",
      classic: "Klassika",
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
        plum: "Ploom",
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
    "Kujunda ise",
  ],
  promo: {
    eyebrow: "Küünekujundaja",
    titleStart: "Kujunda oma küüned",
    titleAccent: "juba enne külastust.",
    text: "Meie kujundajas paned paari minutiga kokku täpselt sellise komplekti, nagu soovid. Nii tead sa ise, mida tahad, ja meie teame, mida teha.",
    steps: [
      {
        title: "Pikkus ja kuju",
        text: "Vali, kui pikad ja millise kujuga küüned sulle sobivad.",
      },
      {
        title: "Värv ja viimistlus",
        text: "Kümned toonid, kroom, ombré ja prantsuse maniküür.",
      },
      {
        title: "Mustrid ja kivid",
        text: "Lisa mustreid, illustratsioone ja kivikesi igale küünele eraldi.",
      },
      {
        title: "Laadi alla ja jaga",
        text: "Salvesta pilt või jaga lingiga ning võta see salongi kaasa.",
      },
    ],
    cta: "Ava kujundaja",
    note: "Tasuta, ilma kontota ja töötab ka telefonis.",
    samples: ["french", "chrome", "cherry", "galaxy", "marble"],
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
      {
        question: "Kas saan oma kujunduse ette valmis mõelda?",
        answer:
          "Jah. Meie küünekujundajas valid pikkuse, kuju, värvi ja kaunistused, laadid pildi alla ja võtad selle külastusele kaasa.",
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
  designer: {
    meta: {
      title: "Kujunda oma küüned enne külastust | Lumora Nail Lounge",
      description:
        "Pane enne külastust kokku oma unistuste küünekomplekt: pikkus, kuju, värv ja kaunistused. Laadi pilt alla ja võta see salongi kaasa.",
    },
    title: "Kujunda oma küüned",
    lead: [
      "Vali pikkus, kuju ja värv, lisa mustrid ja kivikesed ning laadi tulemus pildina alla.",
      "Võta see külastusele kaasa.",
    ],
    hands: {
      right: "Parem",
      left: "Vasak",
      both: "Mõlemad",
      copyOther: "Kopeeri teiselt käelt",
      hint: "Muudatused rakenduvad selle käe kõigile viiele küünele.",
      formHint: "Pikkus, kuju ja teravus on mõlemal käel ühesugused.",
      label: "Käsi",
    },
    toolbar: {
      leftHand: "Vasak käsi",
      hideMenu: "Peida menüü",
      showMenu: "Näita menüüd",
      menu: "Menüü",
      close: "Sulge",
      undo: "Võta tagasi",
      redo: "Tee uuesti",
      reset: "Alusta uuesti",
      resetConfirm: "Kustutada kogu kujundus ja alustada tühjalt?",
      confirm: "Kustuta",
      cancel: "Loobu",
      download: "Laadi alla",
      share: "Jaga",
      copyLink: "Kopeeri link",
      linkCopied: "Link kopeeritud",
      randomAll: "Üllata mind",
      random: "Juhuslik",
    },
    panels: {
      length: "Pikkus",
      shape: "Kuju",
      sharpness: "Teravus",
      color: "Värv",
      design: "Kujundus",
    },
    presets: {
      stiletto: "Stiletto",
      softStiletto: "Pehme stiletto",
      almond: "Mandel",
      coffin: "Kirst",
      softCoffin: "Pehme kirst",
      oval: "Ovaal",
      square: "Kandiline",
      squoval: "Squoval",
      round: "Ümar",
    },
    levelText: "{value} / 5, {name}",
    color: {
      custom: "Oma värv",
      recent: "Viimased",
      finishes: "Eriefektid",
      polishes: "Lakid",
      applied: "Värv {name} rakendatud",
      names: {
        rose: "Roos",
        "rose-soft": "Õrn roos",
        burgundy: "Burgundia",
        plum: "Ploom",
        pearl: "Pärl",
        cherry: "Kirss",
        nude: "Nude",
        ink: "Tint",
        lavender: "Lavendel",
        sage: "Salvei",
        coral: "Korall",
        milk: "Piim",
        chrome: "Kroom",
        holo: "Holo",
        "cat-eye": "Kassisilm",
        aurora: "Virmalised",
        galaxy: "Galaktika",
        ombre: "Ombré",
        sunset: "Loojang",
        candy: "Komm",
        ocean: "Ookean",
      },
    },
    design: {
      addElement: "Lisa element",
      layers: "Küünel olevad elemendid",
      patterns: "Mustrid",
      illustrations: "Pildid",
      stones: "Kivid",
      selected: "Valitud element",
      size: "Suurus",
      rotation: "Pööre",
      offset: "Asend",
      color: "Värv",
      color2: "Teine värv",
      flip: "Peegelda",
      duplicate: "Paljunda",
      forward: "Ettepoole",
      back: "Tahapoole",
      delete: "Kustuta",
      allNails: "Kõik küüned",
      onlyThis: "Ainult see küüs",
      applyTo: "Rakenda",
      done: "Valmis",
      empty: "Sellel küünel pole veel elemente. Lisa muster, pilt või kivi.",
      pick: "Vali element küünelt või loendist, et selle omadusi muuta.",
      previousNail: "Eelmine küüs",
      nextNail: "Järgmine küüs",
      elementLabel: "{name}, {color}, {y} % tipust",
      elementHint:
        "Nooleklahvid liigutavad, [ ja ] pööravad, + ja − muudavad suurust, Delete kustutab.",
    },
    fingers: {
      thumb: "Pöial",
      index: "Nimetissõrm",
      middle: "Keskmine sõrm",
      ring: "Sõrmusesõrm",
      pinky: "Väike sõrm",
    },
    elements: {
      french: "Prantsuse tipp",
      "half-moon": "Poolkuu",
      ombre: "Ombré",
      diagonal: "Diagonaal",
      chevron: "Sakk",
      stripes: "Triibud",
      polka: "Täpid",
      glitter: "Sädelus",
      marble: "Marmor",
      leopard: "Leopard",
      snow: "Lumi",
      stars: "Tähed",
      hearts: "Südamed",
      foil: "Kuldleht",
      heart: "Süda",
      star: "Täht",
      sparkle: "Säde",
      daisy: "Karikakar",
      moon: "Kuu",
      butterfly: "Liblikas",
      leaf: "Leht",
      cherry: "Kirss",
      bow: "Lehv",
      smiley: "Naerunägu",
      lightning: "Välk",
      bat: "Nahkhiir",
      snowflake: "Lumehelves",
      "evil-eye": "Kuri silm",
      "round-xs": "Ümar XS",
      "round-s": "Ümar S",
      "round-m": "Ümar M",
      "round-l": "Ümar L",
      "drop-m": "Tilk M",
      "drop-l": "Tilk L",
      "square-s": "Kandiline S",
      "square-m": "Kandiline M",
    },
    stoneColors: {
      crystal: "Kristall",
      ab: "AB",
      rose: "Roosa",
      gold: "Kuld",
      black: "Must",
      emerald: "Smaragd",
    },
    export: {
      length: "Pikkus",
      caption: "{side} käsi",
      failed: "Pilti ei õnnestunud luua",
      working: "Pilti luuakse…",
      fileName: "lumora-kyyned",
    },
    nailButton: "{side} käsi, {finger}",
    live: {
      length: "Pikkus {value}",
      shape: "Kuju {value}, {name}",
      sharpness: "Teravus {value}, {name}",
    },
  },
};

const en: Dictionary = {
  meta: {
    title: "Lumora Nail Lounge | Nail salon in Tallinn",
    description:
      "A new nail salon opening soon in Tallinn. Manicures, gel polish, extensions, BIAB overlays and nail art. Follow us on Instagram for opening news.",
    ogAlt: "Lumora Nail Lounge – a new nail salon opening soon in Tallinn",
  },
  nav: {
    instagram: "Instagram",
    time: "Your time",
    faq: "FAQ",
    designer: "Design",
    contact: "Get in touch",
    switchLabel: "Vaheta eesti keelele",
    menuLabel: "Menu",
  },
  hero: {
    eyebrow: "Lumora Nail Lounge",
    titleStart: "A new nail salon",
    titleAccent: "in Tallinn",
    titleEnd: "opening soon.",
    lead: "Manicures, gel polish, extensions and nail art. We will announce the opening date on Instagram.",
    primary: "Get in touch",
    secondary: "Follow on Instagram",
    designer: "Design your nails",
    badge: "Design your nails · ",
    picker: {
      hint: "Click the bottle to pick a colour",
      title: "Pick a colour",
      text: "The nails are painted in the shade you choose. Classic and Random let the brush carry on by itself.",
      random: "Random",
      classic: "Classic",
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
        plum: "Plum",
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
  marquee: [
    "Manicure",
    "Gel polish",
    "Extensions",
    "BIAB overlay",
    "Nail art",
    "Design your own",
  ],
  promo: {
    eyebrow: "Nail designer",
    titleStart: "Design your nails",
    titleAccent: "before you visit.",
    text: "Our designer lets you put together exactly the set you want in a couple of minutes. You know what you are after, and we know what to do.",
    steps: [
      {
        title: "Length and shape",
        text: "Choose how long and what shape suits you best.",
      },
      {
        title: "Colour and finish",
        text: "Dozens of shades, chrome, ombré and French tips.",
      },
      {
        title: "Patterns and stones",
        text: "Add patterns, illustrations and stones to each nail on its own.",
      },
      {
        title: "Download and share",
        text: "Save a picture or share a link, and bring it to the salon.",
      },
    ],
    cta: "Open the designer",
    note: "Free, no account needed, and it works on your phone.",
    samples: ["french", "chrome", "cherry", "galaxy", "marble"],
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
      {
        question: "Can I plan my design in advance?",
        answer:
          "Yes. In our nail designer you pick the length, shape, colour and decoration, download the picture and bring it to your appointment.",
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
  designer: {
    meta: {
      title: "Design your nails before your visit | Lumora Nail Lounge",
      description:
        "Put together the nail set of your dreams before your visit: length, shape, colour and decoration. Download the picture and bring it to the salon.",
    },
    title: "Design your nails",
    lead: [
      "Pick a length, shape and colour, then add patterns and stones.",
      "Download the result as a picture to bring to your appointment.",
    ],
    hands: {
      right: "Right",
      left: "Left",
      both: "Both",
      copyOther: "Copy from the other hand",
      hint: "Changes apply to all five nails of this hand.",
      formHint: "Length, shape and sharpness are the same on both hands.",
      label: "Hand",
    },
    toolbar: {
      leftHand: "Left hand",
      hideMenu: "Hide menu",
      showMenu: "Show menu",
      menu: "Menu",
      close: "Close",
      undo: "Undo",
      redo: "Redo",
      reset: "Reset",
      resetConfirm: "Clear the whole design and start over?",
      confirm: "Clear",
      cancel: "Cancel",
      download: "Download",
      share: "Share",
      copyLink: "Copy link",
      linkCopied: "Link copied",
      randomAll: "Surprise me",
      random: "Random",
    },
    panels: {
      length: "Length",
      shape: "Shape",
      sharpness: "Sharpness",
      color: "Colour",
      design: "Design",
    },
    presets: {
      stiletto: "Stiletto",
      softStiletto: "Soft stiletto",
      almond: "Almond",
      coffin: "Coffin",
      softCoffin: "Soft coffin",
      oval: "Oval",
      square: "Square",
      squoval: "Squoval",
      round: "Round",
    },
    levelText: "{value} of 5, {name}",
    color: {
      custom: "Custom",
      recent: "Recent",
      finishes: "Special finishes",
      polishes: "Polishes",
      applied: "Colour {name} applied",
      names: {
        rose: "Rose",
        "rose-soft": "Soft rose",
        burgundy: "Burgundy",
        plum: "Plum",
        pearl: "Pearl",
        cherry: "Cherry",
        nude: "Nude",
        ink: "Ink",
        lavender: "Lavender",
        sage: "Sage",
        coral: "Coral",
        milk: "Milk",
        chrome: "Chrome",
        holo: "Holo",
        "cat-eye": "Cat eye",
        aurora: "Aurora",
        galaxy: "Galaxy",
        ombre: "Ombré",
        sunset: "Sunset",
        candy: "Candy",
        ocean: "Ocean",
      },
    },
    design: {
      addElement: "Add element",
      layers: "Elements on this nail",
      patterns: "Patterns",
      illustrations: "Illustrations",
      stones: "Rhinestones",
      selected: "Selected element",
      size: "Size",
      rotation: "Rotation",
      offset: "Position",
      color: "Colour",
      color2: "Second colour",
      flip: "Flip",
      duplicate: "Duplicate",
      forward: "Bring forward",
      back: "Send back",
      delete: "Delete",
      allNails: "All nails",
      onlyThis: "Only this nail",
      applyTo: "Apply to",
      done: "Done",
      empty:
        "No elements on this nail yet. Add a pattern, an illustration or a stone.",
      pick: "Choose an element on the nail or in the list to change its properties.",
      previousNail: "Previous nail",
      nextNail: "Next nail",
      elementLabel: "{name}, {color}, {y} % from the top",
      elementHint:
        "Arrow keys move, [ and ] rotate, + and − resize, Delete removes.",
    },
    fingers: {
      thumb: "Thumb",
      index: "Index finger",
      middle: "Middle finger",
      ring: "Ring finger",
      pinky: "Little finger",
    },
    elements: {
      french: "French tip",
      "half-moon": "Half moon",
      ombre: "Ombré",
      diagonal: "Diagonal split",
      chevron: "Chevron",
      stripes: "Stripes",
      polka: "Polka dots",
      glitter: "Glitter",
      marble: "Marble",
      leopard: "Leopard",
      snow: "Snow",
      stars: "Stars",
      hearts: "Hearts",
      foil: "Gold foil",
      heart: "Heart",
      star: "Star",
      sparkle: "Sparkle",
      daisy: "Daisy",
      moon: "Moon",
      butterfly: "Butterfly",
      leaf: "Leaf",
      cherry: "Cherry",
      bow: "Bow",
      smiley: "Smiley",
      lightning: "Lightning",
      bat: "Bat",
      snowflake: "Snowflake",
      "evil-eye": "Evil eye",
      "round-xs": "Round XS",
      "round-s": "Round S",
      "round-m": "Round M",
      "round-l": "Round L",
      "drop-m": "Teardrop M",
      "drop-l": "Teardrop L",
      "square-s": "Square S",
      "square-m": "Square M",
    },
    stoneColors: {
      crystal: "Crystal",
      ab: "Aurora borealis",
      rose: "Rose",
      gold: "Gold",
      black: "Black",
      emerald: "Emerald",
    },
    export: {
      length: "Length",
      caption: "{side} hand",
      failed: "Could not create the image",
      working: "Creating the image…",
      fileName: "lumora-nails",
    },
    nailButton: "{side} hand, {finger}",
    live: {
      length: "Length {value}",
      shape: "Shape {value}, {name}",
      sharpness: "Sharpness {value}, {name}",
    },
  },
};

const dictionaries: Record<Locale, Dictionary> = { et, en };

const LOCALES: readonly Locale[] = ["et", "en"];

// Estonian lives at the root, other languages under their own prefix.
const localePath = (locale: Locale): string =>
  locale === "et" ? "/" : `/${locale}/`;

type Page = "home" | "designer";

// The designer's slug in each language; the home page is the locale root.
const PAGE_SLUGS: Record<Locale, Record<Page, string>> = {
  et: { home: "", designer: "kujundaja/" },
  en: { home: "", designer: "designer/" },
};

const localePagePath = (locale: Locale, page: Page): string =>
  `${localePath(locale)}${PAGE_SLUGS[locale][page]}`;

const localeUrl = (locale: Locale, page: Page = "home"): string =>
  `${SITE_URL}${localePagePath(locale, page)}`;

// Fills `{name}` placeholders in a copy string.
const fill = (template: string, values: Record<string, string | number>) =>
  template.replaceAll(/{(\w+)}/g, (match, key: string) => {
    const value = values[key];

    return value === undefined ? match : String(value);
  });

const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

export type {
  DesignerCopy,
  Dictionary,
  FingerName,
  Locale,
  Page,
  PerkKind,
  Picker,
  Preset,
  Question,
};

export {
  EMAIL,
  fill,
  getDictionary,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  localePagePath,
  localePath,
  LOCALES,
  localeUrl,
  SITE_NAME,
  SITE_URL,
};
