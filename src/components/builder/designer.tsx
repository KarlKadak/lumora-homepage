"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { POLISHES } from "@/components/builder/color-panel";
import type { DesignPart } from "@/components/builder/design-panel";
import {
  DesignPanel,
  FINGER_NAMES,
  fingerName,
  percentFromTip,
  sideName,
} from "@/components/builder/design-panel";
import type { ElementDefinition } from "@/components/builder/elements";
import { definitionOf, ElementDefs } from "@/components/builder/elements";
import {
  canShareFiles,
  composeCollage,
  downloadBlob,
  shareBlob,
  todayStamp,
} from "@/components/builder/export";
import { type Field, FormSliders } from "@/components/builder/form-sliders";
import { HandDrawing } from "@/components/builder/hand-drawing";
import {
  Accordion,
  type Panel,
  type Section,
  Sheet,
} from "@/components/builder/menu";
import { NailEditor, NailView } from "@/components/builder/nail-editor";
import {
  randomLevel,
  randomPaint,
  randomPattern,
  randomSet,
} from "@/components/builder/random";
import { ICONS, type Tool, Toolbar } from "@/components/builder/stage";
import type {
  Action,
  DesignerState,
  Finger,
  NailDesign,
  NailElement,
  Paint,
  Side,
  Target,
} from "@/components/builder/state";
import {
  designKey,
  FINGERS,
  handOf,
  INITIAL_HISTORY,
  mirroredHand,
  nailKey,
  nailOf,
  paintKey,
  reduceHistory,
  SIDES,
} from "@/components/builder/state";
import {
  clearDraft,
  decodeHash,
  encodeHash,
  loadDraft,
  makeId,
  saveDraft,
} from "@/components/builder/storage";
import { FinishGradients } from "@/components/nail-finishes";
import { type Level, presetOf, tipY } from "@/components/nail-form";
import type { DesignerCopy, Locale } from "@/content/dictionary";
import { fill } from "@/content/dictionary";

// The designer's client root: the undoable design state, the view state
// (which hand, which panel, design mode), the two layouts and everything
// that talks to the browser (draft, share link, download).
//
// The workspace fills the viewport under the header on every screen, so
// nothing scrolls but the menu's own content. Both hands are always
// mounted: on desktop the left hand's column grows from nothing, on phones
// the hands cross-fade, so the drawings keep their state and their zoom.

interface Designing extends Target {
  selected?: string;
}

interface ViewState {
  // The hand the menu edits.
  hand: Side;
  // Desktop: both arches on the stage.
  both: boolean;
  menu: "open" | "hidden";
  // The open section, if any.
  panel: Panel | undefined;
  designing?: Designing;
  // Phone: the open submenu point's popup.
  part?: string;
  // Design mode set aside while the menu is hidden, to resume on show.
  parked?: Designing;
}

const INITIAL_VIEW: ViewState = {
  hand: "right",
  both: false,
  menu: "open",
  panel: "length",
};

// Left hand on the left, as the hands lie on a table.
const STAGE_ORDER: readonly Side[] = ["left", "right"];

const PHONE_QUERY = "(max-width: 767px)";

const subscribePhone = (callback: () => void) => {
  const query = globalThis.matchMedia(PHONE_QUERY);

  query.addEventListener("change", callback);

  return () => {
    query.removeEventListener("change", callback);
  };
};
const readPhone = () => globalThis.matchMedia(PHONE_QUERY).matches;
const readPhoneOnServer = () => false;

const reducedMotion = () =>
  globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ZOOM_DURATION = 450;

const DRAFT_DEBOUNCE = 300;

// One copy of the finish and stone gradients for every swatch and mini nail
// on the page; the hands and the export tiles carry their own.
const SHARED_DEFS = "nd";

const SharedDefs = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      <FinishGradients idPrefix={SHARED_DEFS} />
      <ElementDefs prefix={SHARED_DEFS} />
    </defs>
  </svg>
);

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable);

// Where a new element lands: the middle of the nail, stones jittered a
// little so repeated taps do not pile up invisibly.
const placeNew = (
  definition: ElementDefinition,
  length: Level,
): NailElement => {
  const middle = (tipY(length) + 52) / 2;
  const jitter = definition.kind === "stone" ? (Math.random() - 0.5) * 14 : 0;

  return {
    id: makeId(),
    kind: definition.kind,
    variant: definition.variant,
    x: definition.kind === "pattern" ? 0 : jitter,
    y: definition.kind === "pattern" ? 0 : middle + jitter * 0.6,
    scale: 1,
    rotation: 0,
    flip: false,
    color: definition.color,
    ...(definition.color2 === undefined ? {} : { color2: definition.color2 }),
    ...(definition.offset === undefined ? {} : { offset: definition.offset }),
  };
};

// The nail button on the stage that opened design mode.
const focusNail = (target: Target) => {
  const nail = document.querySelector<SVGGElement>(
    `[data-hand="${target.side}"] [data-finger="${String(target.finger)}"][role="button"]`,
  );

  nail?.focus();
};

const EASE = "ease-[cubic-bezier(0.2,0.7,0.2,1)]";

// A small shuffle button in a section's header: randomises that section.
// A round arrow beside the nail editor, stepping to the neighbouring nail.
const NailArrow = ({
  direction,
  label,
  onClick,
}: Readonly<{ direction: 1 | -1; label: string; onClick: () => void }>) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-pearl/15 text-rose transition-colors hover:bg-rose hover:text-burgundy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d={direction === 1 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  </button>
);

const ShuffleButton = ({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-rose/60 text-burgundy transition-[background-color,transform] duration-200 hover:bg-rose/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose"
  >
    {ICONS.shuffle}
  </button>
);

// Whether the ten nails differ under `key`: by whole design, or by polish
// alone. The left hand is compared as seen in a mirror, since copies onto it
// are mirrored.
const nailsVary = (state: DesignerState, key: (nail: NailDesign) => string) => {
  const left = state.left === undefined ? undefined : mirroredHand(state.left);

  return (
    new Set(
      SIDES.flatMap((side) =>
        (side === "left" ? (left ?? state.right) : state.right).nails.map(
          (nail) => key(nail),
        ),
      ),
    ).size > 1
  );
};

const segment =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-4 text-xs font-semibold transition-[background-color,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose disabled:cursor-default disabled:opacity-40";

interface ExportSlots {
  left: SVGSVGElement | undefined;
  right: SVGSVGElement | undefined;
  tiles: (SVGSVGElement | undefined)[];
}

const Designer = ({
  locale,
  copy,
}: Readonly<{ locale: Locale; copy: DesignerCopy }>) => {
  // The designer only renders in the browser, so the draft, the shared
  // link and the device are all known before the first paint.
  const [history, dispatch] = useReducer(reduceHistory, undefined, () => {
    const restored = decodeHash(globalThis.location.hash) ?? loadDraft();

    return restored ?
        reduceHistory(INITIAL_HISTORY, { type: "load", state: restored })
      : INITIAL_HISTORY;
  });
  const [view, setView] = useState<ViewState>(() => ({
    ...INITIAL_VIEW,
    both: history.present.left !== undefined,
  }));
  const [announcement, setAnnouncement] = useState("");
  const [editorShown, setEditorShown] = useState(false);
  const [exporting, setExporting] = useState<"download" | "share" | undefined>(
    undefined,
  );
  const [toast, setToast] = useState<string | undefined>(undefined);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareable] = useState(canShareFiles);
  // Edits to the edited nail go to every nail while this is on.
  // "All nails" is the default; picking a single nail overrides it.
  const [designAll, setDesignAll] = useState(true);
  const [paintAll, setPaintAll] = useState(true);
  const isPhone = useSyncExternalStore(
    subscribePhone,
    readPhone,
    readPhoneOnServer,
  );
  const dialogReference = useRef<HTMLDialogElement>(null);
  const panelReference = useRef<HTMLDivElement>(null);
  const slots = useRef<ExportSlots>({
    left: undefined,
    right: undefined,
    tiles: [],
  });
  // The latest state for stable handlers, so memoised children keep their
  // props between renders.
  const latest = useRef<{
    state: DesignerState;
    view: ViewState;
    designAll: boolean;
  }>({ state: history.present, view, designAll: true });
  const titleId = useId();
  const state = history.present;
  const designing = view.designing;

  latest.current = { state, view, designAll };

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  // The workspace is sized to the viewport, so a refresh starts at the top
  // rather than where the browser remembers the page being scrolled to.
  useEffect(() => {
    globalThis.history.scrollRestoration = "manual";
    globalThis.scrollTo(0, 0);

    return () => {
      globalThis.history.scrollRestoration = "auto";
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(state);
    }, DRAFT_DEBOUNCE);

    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z")
        return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      dispatch({ type: event.shiftKey ? "redo" : "undo" });
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // The editor fades in once the zoom has landed on the nail.
  useEffect(() => {
    if (!designing) {
      setEditorShown(false);
      return;
    }
    const timer = setTimeout(
      () => {
        setEditorShown(true);
      },
      reducedMotion() ? 0 : ZOOM_DURATION,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [designing]);

  // On phones a submenu popup closes as soon as something changes, so the
  // nail shows what changed. While a slider is held the close waits for
  // the release, or the control would vanish mid-drag.
  const steps = history.past.length + history.future.length;
  const slider = useRef({ held: false, pending: false });

  useEffect(() => {
    const fold = () => {
      setView((current) => ({ ...current, part: undefined }));
    };
    const down = (event: PointerEvent) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "range"
      ) {
        slider.current.held = true;
      }
    };
    const up = () => {
      if (!slider.current.held) return;
      slider.current.held = false;
      if (slider.current.pending) {
        slider.current.pending = false;
        fold();
      }
    };

    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);

    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    if (!isPhone || steps === 0) return;
    if (slider.current.held) {
      slider.current.pending = true;
      return;
    }
    setView((current) => ({ ...current, part: undefined }));
  }, [isPhone, steps, state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(undefined);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast]);

  // `single` narrows the edits to that nail: picking from the strip, or a
  // nail on the hand while already designing; entering design mode from
  // the stage or the tab keeps the default of all nails. Nails that already
  // differ (after a random set, say) are edited one at a time either way, so
  // the first edit does not quietly overwrite the others; likewise the polish
  // when it varies.
  const openDesign = useCallback((target: Target, single = false) => {
    if (single) {
      setDesignAll(false);
      setPaintAll(false);
    } else {
      const { state: current } = latest.current;

      if (nailsVary(current, designKey)) setDesignAll(false);
      if (nailsVary(current, (nail) => paintKey(nail.paint)))
        setPaintAll(false);
    }
    setView((current) => ({
      ...current,
      hand: target.side,
      both: current.both || target.side === "left",
      menu: "open",
      panel: "design",
      part: current.panel === "design" ? current.part : undefined,
      designing: { ...target },
      parked: undefined,
    }));
    setTimeout(() => {
      panelReference.current?.focus({ preventScroll: true });
    }, 50);
  }, []);

  // The arrows beside the editor step through all ten nails in the order
  // they lie on the stage: the left hand from its little finger inwards, then
  // the right hand from its thumb outwards. Past either end they wrap to the
  // other hand's little finger. The all-nails toggles stay as they were,
  // unless the nails differ.
  const stepNail = useCallback(
    (target: Target, by: 1 | -1) => {
      const count = FINGERS.length;
      const position =
        target.side === "left" ?
          count - 1 - target.finger
        : count + target.finger;
      const next = (position + by + 2 * count) % (2 * count);
      const side: Side = next < count ? "left" : "right";
      const finger = (
        side === "left" ?
          count - 1 - next
        : next - count) as Finger;

      openDesign({ side, finger });
    },
    [openDesign],
  );

  const onNail = useCallback(
    (side: Side, finger: Finger) => {
      openDesign({ side, finger }, latest.current.view.designing !== undefined);
    },
    [openDesign],
  );

  const setPanel = (panel: Panel | undefined) => {
    setView((current) => ({
      ...current,
      panel,
      part: undefined,
      designing:
        panel === "design" ?
          (current.designing ?? { side: current.hand, finger: 1 })
        : undefined,
    }));
  };

  const setPart = useCallback((part: string | undefined) => {
    setView((current) => ({ ...current, part }));
  }, []);

  const closeDesign = () => {
    const last = designing;

    setView((current) => ({
      ...current,
      panel: undefined,
      designing: undefined,
    }));
    if (last) {
      setTimeout(() => {
        focusNail(last);
      }, 50);
    }
  };

  const selectElement = useCallback((selected: string | undefined) => {
    setView((current) =>
      current.designing ?
        { ...current, designing: { ...current.designing, selected } }
      : current,
    );
  }, []);

  const setHand = (hand: Side) => {
    setView((current) => ({
      ...current,
      hand,
      both: current.both || hand === "left",
      designing:
        current.designing ?
          { ...current.designing, side: hand, selected: undefined }
        : undefined,
    }));
  };

  const changeForm = (field: Field, value: Level) => {
    dispatch({ type: "form", form: { [field]: value } });
    const form = { ...handOf(state, view.hand).form, [field]: value };
    const name = copy.presets[presetOf(form)];

    announce(fill(copy.live[field], { value, name }));
  };

  // Paints the edited nail, or every nail of both hands.
  const applyPaint = (paint: Paint, name: string, all: boolean) => {
    const target = designing ?? { side: view.hand, finger: 1 };

    if (all) {
      for (const side of SIDES) {
        dispatch({ type: "paint", side, fingers: FINGERS, paint });
      }
    } else {
      dispatch({
        type: "paint",
        side: target.side,
        fingers: [target.finger],
        paint,
      });
    }
    announce(fill(copy.color.applied, { name }));
  };

  const addElement = useCallback(
    (definition: ElementDefinition) => {
      const target = latest.current.view.designing;

      if (!target) return;
      const element = placeNew(
        definition,
        handOf(latest.current.state, target.side).form.length,
      );

      dispatch(
        latest.current.designAll ?
          {
            type: "batch",
            actions: [
              { type: "add", target, element },
              {
                type: "copy",
                from: target,
                to: SIDES.flatMap((side) =>
                  FINGERS.filter(
                    (finger) =>
                      side !== target.side || finger !== target.finger,
                  ).map((finger) => ({ target: { side, finger } })),
                ),
                seed: makeId(),
                mirror: true,
              },
            ],
          }
        : { type: "add", target, element },
      );
      selectElement(element.id);
    },
    [selectElement],
  );

  const randomiseForm = (field: Field) => {
    changeForm(field, randomLevel(Math.random));
  };

  const randomiseColor = (all: boolean) => {
    const paint = randomPaint(Math.random);
    const key =
      paint.kind === "solid" ?
        (POLISHES.find((polish) => polish.hex === paint.hex)?.id ?? paint.hex)
      : paint.id;

    applyPaint(paint, copy.color.names[key] ?? key, all);
  };

  const randomiseNail = () => {
    if (!designing) return;
    // Only the pattern changes: the polish and anything placed on the nail
    // are the user's own choices and stay.
    const nail = nailOf(state, designing);
    const design = {
      ...nail,
      elements: [
        randomPattern(
          nail.paint,
          handOf(state, designing.side).form.length,
          Math.random,
          makeId,
        ),
        ...nail.elements.filter((element) => element.kind !== "pattern"),
      ],
    };

    spread({ type: "replace", target: designing, design }, designing);
    selectElement(undefined);
  };

  // A whole random set on the right hand, mirrored by the left; the menu
  // gets out of the way so both hands show.
  const randomiseAll = () => {
    dispatch({
      type: "hands",
      right: randomSet(Math.random, makeId),
      left: undefined,
    });
    setView((current) => ({
      ...current,
      hand: "right",
      both: true,
      menu: "hidden",
      designing: undefined,
    }));
    announce(copy.toolbar.randomAll);
  };

  // While "all nails" is on, every edit to the edited nail is followed by
  // a copy of that nail onto all the others, in one undo step.
  const copyToAll = (from: Target): Action => ({
    type: "copy",
    from,
    to: SIDES.flatMap((side) =>
      FINGERS.filter(
        (finger) => side !== from.side || finger !== from.finger,
      ).map((finger) => ({ target: { side, finger } })),
    ),
    seed: makeId(),
    mirror: true,
  });
  const spread = (action: Action, target: Target) => {
    dispatch(
      designAll ?
        { type: "batch", actions: [action, copyToAll(target)] }
      : action,
    );
  };
  const setDesignAllNails = (all: boolean) => {
    setDesignAll(all);
    if (all && designing) dispatch(copyToAll(designing));
  };

  const elementLabel = (element: NailElement) => {
    if (!designing) return element.variant;
    const form = handOf(state, designing.side).form;
    const color =
      element.kind === "stone" ?
        (copy.stoneColors[element.color] ?? element.color)
      : element.color;

    return fill(copy.design.elementLabel, {
      name: copy.elements[element.variant] ?? element.variant,
      color,
      y: percentFromTip(element.y, form),
    });
  };

  const nailLabels = useMemo(() => {
    const labels = (side: Side) =>
      FINGERS.map((finger) =>
        fill(copy.nailButton, {
          side: sideName(copy, side),
          finger: fingerName(copy, finger),
        }),
      );

    return { right: labels("right"), left: labels("left") };
  }, [copy]);

  const handCaption = (side: Side) => {
    const hand = handOf(state, side);

    return `${fill(copy.export.caption, { side: sideName(copy, side) })} · ${copy.export.length} ${String(hand.form.length)} · ${copy.presets[presetOf(hand.form)]}`;
  };

  // Copies to the left hand are mirrored, so wherever the hands are
  // compared, the left is taken as seen in a mirror.
  const leftUnmirrored =
    state.left === undefined ? undefined : mirroredHand(state.left);

  // Left little finger to right little finger, as the hands lie.
  const allNails = STAGE_ORDER.flatMap((side) =>
    (side === "left" ? FINGERS.toReversed() : FINGERS).map((finger) => ({
      side,
      finger,
    })),
  );
  // The left hand is compared as seen in a mirror, like above.
  const nailsDiffer =
    new Set(
      allNails.map(({ side, finger }) =>
        nailKey(
          side === "left" ? (leftUnmirrored ?? state.right) : state.right,
          finger,
        ),
      ),
    ).size > 1;

  // Renders the hands and tiles offscreen, then composes and hands over.
  useEffect(() => {
    if (!exporting) return;
    const { left, right } = slots.current;
    const rendered = slots.current.tiles.filter((tile) => tile !== undefined);
    // One tile stands for the whole set when every nail is alike.
    const tiles = nailsDiffer ? rendered : rendered.slice(0, 1);

    if (!left || !right) return;
    const mode = exporting;
    const fileName = `${copy.export.fileName}-${todayStamp()}.png`;
    const run = async () => {
      const blob = await composeCollage({
        left,
        right,
        tiles,
        captions: {
          title: "Lumora",
          subtitle: "Nail Lounge",
          date: new Date().toLocaleDateString(
            locale === "et" ? "et-EE" : "en-GB",
          ),
          left: handCaption("left"),
          right: handCaption("right"),
          tiles:
            nailsDiffer ?
              allNails.map(({ finger }) => fingerName(copy, finger))
            : [copy.presets[presetOf(state.right.form)]],
        },
      });

      if (mode === "share") await shareBlob(blob, fileName, copy.title);
      else downloadBlob(blob, fileName);
    };

    run()
      .catch((error: unknown) => {
        // A dismissed share sheet is not a failure.
        if (error instanceof Error && error.name === "AbortError") return;
        setToast(copy.export.failed);
      })
      .finally(() => {
        setExporting(undefined);
      });
    // The captions and tiles are read when the export starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exporting]);

  const copyLink = async () => {
    try {
      const url = `${globalThis.location.origin}${globalThis.location.pathname}${encodeHash(state)}`;

      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      announce(copy.toolbar.linkCopied);
      setTimeout(() => {
        setLinkCopied(false);
      }, 2500);
    } catch {
      setToast(copy.export.failed);
    }
  };

  const reset = () => {
    dispatch({ type: "reset" });
    clearDraft();
    globalThis.history.replaceState(
      undefined,
      "",
      globalThis.location.pathname,
    );
    setView(INITIAL_VIEW);
  };

  // Hiding the menu leaves design mode (zooming back out) and shows both
  // hands as an overview.
  // Hiding the menu zooms out of a nail being designed and shows both
  // hands; showing it again zooms back in on that nail.
  const toggleMenu = () => {
    const last = designing;

    setView((current) =>
      current.menu === "open" ?
        {
          ...current,
          menu: "hidden",
          both: true,
          designing: undefined,
          parked: current.designing,
        }
      : {
          ...current,
          menu: "open",
          designing: current.parked,
          parked: undefined,
        },
    );
    if (last && view.menu === "open") {
      setTimeout(() => {
        focusNail(last);
      }, 50);
    }
  };

  const tools: readonly Tool[] = [
    {
      key: "menu",
      label:
        view.menu === "open" ? copy.toolbar.hideMenu : copy.toolbar.showMenu,
      icon: ICONS.menu,
      pressed: view.menu === "open",
      onClick: toggleMenu,
    },
    {
      // Which hand the menu edits; the label names the current one.
      key: "hand",
      label: copy.hands[view.hand],
      title: `${copy.hands.label}: ${copy.hands[view.hand]}`,
      icon: ICONS.hand,
      onClick: () => {
        setHand(view.hand === "right" ? "left" : "right");
      },
    },
    {
      key: "random",
      label: copy.toolbar.randomAll,
      icon: ICONS.shuffle,
      onClick: randomiseAll,
    },
    {
      key: "undo",
      label: copy.toolbar.undo,
      icon: ICONS.undo,
      disabled: history.past.length === 0,
      onClick: () => {
        dispatch({ type: "undo" });
      },
    },
    {
      key: "redo",
      label: copy.toolbar.redo,
      icon: ICONS.redo,
      disabled: history.future.length === 0,
      onClick: () => {
        dispatch({ type: "redo" });
      },
    },
    {
      key: "reset",
      label: copy.toolbar.reset,
      icon: ICONS.reset,
      onClick: () => {
        dialogReference.current?.showModal();
      },
    },
    {
      key: "link",
      label: linkCopied ? copy.toolbar.linkCopied : copy.toolbar.copyLink,
      icon: ICONS.link,
      onClick: () => {
        void copyLink();
      },
    },
    {
      key: "download",
      label: copy.toolbar.download,
      icon: ICONS.download,
      busy: exporting === "download",
      disabled: exporting !== undefined,
      onClick: () => {
        setExporting("download");
      },
    },
    ...(shareable ?
      [
        {
          key: "share",
          label: copy.toolbar.share,
          icon: ICONS.share,
          busy: exporting === "share",
          disabled: exporting !== undefined,
          onClick: () => {
            setExporting("share");
          },
        },
      ]
    : []),
  ];

  const menuHidden = view.menu === "hidden";
  const bothShown = isPhone ? menuHidden : view.both || menuHidden;
  const editedHand = handOf(state, view.hand);
  const designTarget = designing ?? { side: view.hand, finger: 1 };

  // Only when the hands differ: one button makes the edited hand a copy of
  // the other, after which the left hand follows the right again.
  const handsDiffer =
    leftUnmirrored !== undefined &&
    FINGERS.some(
      (finger) =>
        nailKey(state.right, finger) !== nailKey(leftUnmirrored, finger),
    );
  const copyOtherHand = () => {
    if (view.hand === "left" || !state.left) {
      dispatch({ type: "matchRight" });
      return;
    }
    dispatch({
      type: "hands",
      right: {
        ...state.right,
        nails: state.left.nails.map((nail) => ({
          ...nail,
          elements: nail.elements.map((element) => ({
            ...element,
            id: makeId(),
          })),
        })),
      },
      left: undefined,
    });
  };
  const menuHeader =
    handsDiffer ?
      <div className="flex justify-end">
        <button
          type="button"
          onClick={copyOtherHand}
          className={`${segment} border border-rose/60 text-burgundy hover:bg-rose/20`}
        >
          {copy.hands.copyOther}
        </button>
      </div>
    : undefined;

  const formContent = (field: Field) => (
    <>
      <p className="mb-1 text-xs text-plum">{copy.hands.formHint}</p>
      <FormSliders
        form={editedHand.form}
        copy={copy}
        fields={[field]}
        onChange={changeForm}
      />
    </>
  );
  const designContent = (part?: DesignPart) => (
    <DesignPanel
      part={part}
      state={state}
      target={designTarget}
      selected={designing?.selected}
      copy={copy}
      prefix={part ? `nd-${part}` : "nd-panel"}
      defs={SHARED_DEFS}
      onSelect={selectElement}
      onAdd={addElement}
      onPatch={(id, patch) => {
        spread(
          { type: "update", target: designTarget, id, patch },
          designTarget,
        );
      }}
      onDelete={(id) => {
        spread({ type: "remove", target: designTarget, id }, designTarget);
      }}
      onDuplicate={(id) => {
        const newId = makeId();

        spread(
          { type: "duplicate", target: designTarget, id, newId },
          designTarget,
        );
        selectElement(newId);
      }}
      onReorder={(id, by) => {
        spread({ type: "reorder", target: designTarget, id, by }, designTarget);
      }}
      designAll={designAll}
      onDesignAll={setDesignAllNails}
      paintAll={paintAll}
      onPaintAll={setPaintAll}
      onRandom={randomiseNail}
      onPaint={applyPaint}
      onRandomPaint={randomiseColor}
      onDone={closeDesign}
    />
  );
  const designParts: readonly { key: DesignPart; title: string }[] = [
    { key: "color", title: copy.panels.color },
    { key: "add", title: copy.design.addElement },
    { key: "layers", title: copy.design.layers },
  ];

  const sections: readonly Section[] = [
    ...(["length", "shape", "sharpness"] as const).map((field): Section => ({
      key: field,
      title: copy.panels[field],
      action: (
        <ShuffleButton
          label={copy.toolbar.random}
          onClick={() => {
            randomiseForm(field);
          }}
        />
      ),
      content: formContent(field),
    })),
    {
      key: "design",
      title: copy.panels.design,
      content: (
        <div ref={panelReference} tabIndex={-1} className="outline-none">
          {designContent()}
        </div>
      ),
      parts: designParts.map((entry) => ({
        key: entry.key,
        title: entry.title,
        content: designContent(entry.key),
      })),
    },
  ];

  // One hand with, in design mode, the editor laid over it.
  const handSlot = (side: Side, shown: boolean) => {
    const editing = designing?.side === side ? designing : undefined;
    const hand = handOf(state, side);
    const design = editing && hand.nails[editing.finger];

    return (
      <div
        className={`relative flex h-full min-h-0 w-full justify-center ${isPhone ? "items-start overflow-hidden" : "items-center"}`}
        inert={!shown}
      >
        {/* Phones: the SVG fills the slot and its viewBox is shaped to it,
            keeping every nail in view (see the hand drawing's width fit). */}
        <HandDrawing
          side={side}
          hand={hand}
          prefix={`nd-${side}`}
          fit={isPhone ? "width" : "height"}
          className={
            isPhone ? "h-full w-full" : (
              "h-[min(100%,calc((100cqw_-_7rem)*0.55))] w-auto max-w-full"
            )
          }
          nailLabels={nailLabels[side]}
          onNail={onNail}
          activeFinger={editing?.finger}
          focus={editing?.finger}
          dimmed={editing !== undefined}
          entrance
        />
        {editing && design && (
          <div
            className={`absolute inset-0 flex flex-col items-center gap-2 transition-[opacity,transform] duration-400 ${EASE} motion-reduce:transition-none ${editorShown ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
          >
            {/* Which nail is being edited, and whether edits reach them all. */}
            <p
              aria-live="polite"
              className="shrink-0 rounded-full bg-burgundy-deep/70 px-3.5 py-1.5 text-xs font-semibold text-pearl"
            >
              {sideName(copy, side)}
              <span className="text-rose"> · </span>
              {fingerName(copy, editing.finger)}
              {designAll && (
                <span className="font-normal text-white/70">
                  {" "}
                  ({copy.design.allNails.toLocaleLowerCase(locale)})
                </span>
              )}
            </p>
            <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-2">
              <NailArrow
                direction={-1}
                label={copy.design.previousNail}
                onClick={() => {
                  stepNail(editing, -1);
                }}
              />
              <NailEditor
                design={design}
                form={hand.form}
                prefix={`nd-edit-${side}`}
                defs={SHARED_DEFS}
                className={`h-full ${isPhone ? "max-w-[calc(100%-6rem)]" : "max-w-[60%]"}`}
                selected={editing.selected}
                onSelect={selectElement}
                onChange={(id, patch) => {
                  spread(
                    { type: "update", target: editing, id, patch },
                    editing,
                  );
                }}
                onDelete={(id) => {
                  spread({ type: "remove", target: editing, id }, editing);
                  selectElement(undefined);
                }}
                elementLabel={elementLabel}
                deleteLabel={copy.design.delete}
                hint={copy.design.elementHint}
              />
              <NailArrow
                direction={1}
                label={copy.design.nextNail}
                onClick={() => {
                  stepNail(editing, 1);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Phone: the hands cross-fade in one slot. With the menu hidden both
  // show: stacked in portrait, so each hand spans the screen's width and
  // the nails stay legible (the width fit crops the forearm, and a fade
  // softens the cut), or side by side in landscape, where there is no
  // height to stack in. Desktop: the left hand's column grows from nothing.
  const stage =
    isPhone ?
      <div className="flex h-full min-h-0 flex-col gap-1">
        <div className="flex shrink-0 justify-center pt-3 pb-0.5">
          <Toolbar
            tools={tools}
            compact
            horizontal
            breakAfter="redo"
            label={copy.title}
          />
        </div>
        <div
          className={`flex min-h-0 flex-1 items-stretch gap-1 ${bothShown ? "portrait:flex-col portrait:gap-2" : ""}`}
        >
          {STAGE_ORDER.map((side) => {
            const shown = bothShown || view.hand === side;

            return (
              <div
                key={side}
                className={`relative min-h-0 min-w-0 transition-[flex-grow,opacity] duration-500 ${EASE} motion-reduce:transition-none ${
                  shown ? "grow opacity-100" : (
                    "w-0 grow-0 overflow-hidden opacity-0"
                  )
                } ${
                  bothShown ?
                    "basis-0 portrait:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2.5rem),transparent)]"
                  : ""
                }`}
              >
                {handSlot(side, shown)}
              </div>
            );
          })}
        </div>
      </div>
    : <div className="grid h-full min-h-0 grid-cols-[1fr_auto_1fr]">
        {STAGE_ORDER.map((side) => {
          const shown = bothShown || side === "right";

          return (
            <div
              key={side}
              className={`min-h-0 min-w-0 overflow-hidden transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"} ${side === "left" ? "order-1" : "order-3"}`}
            >
              {handSlot(side, shown)}
            </div>
          );
        })}
        <div className="order-2 flex items-center px-3">
          <Toolbar tools={tools} compact={false} label={copy.title} />
        </div>
      </div>;

  const menuCard = (
    <div className="flex h-full min-h-0 flex-col rounded-3xl bg-pearl/95 p-4 text-ink shadow-xl shadow-burgundy-deep/40 backdrop-blur-md">
      {menuHeader && <div className="mb-3 shrink-0">{menuHeader}</div>}
      <div className="min-h-0 overflow-y-auto">
        <Accordion sections={sections} open={view.panel} onOpen={setPanel} />
      </div>
    </div>
  );

  return (
    <div className="relative bg-burgundy bg-[radial-gradient(ellipse_at_70%_35%,var(--color-burgundy)_0%,var(--color-burgundy)_30%,var(--color-burgundy-deep)_100%)] text-white">
      <SharedDefs />
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {isPhone ?
        <div className="flex h-[calc(100dvh-3.75rem)] flex-col">
          {/* The title stays for assistive tech; the screen is for the hands. */}
          <h1 className="sr-only">{copy.title}</h1>
          <div className="relative min-h-0 flex-1 px-3 pt-1 pb-2">{stage}</div>
          {menuHidden ?
            <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
          : <Sheet
              sections={sections}
              open={view.panel}
              onOpen={setPanel}
              header={menuHeader}
              part={view.part}
              onPart={setPart}
              closeLabel={copy.toolbar.close}
            />
          }
        </div>
      : <div className="mx-auto flex h-[calc(100dvh-4.25rem)] max-w-7xl flex-col px-6 pt-4 pb-5">
          <div className="flex shrink-0 flex-col items-center gap-3 text-center">
            <div>
              <h1 className="font-serif text-3xl leading-tight font-medium">
                {copy.title}
              </h1>
              <p className="mt-1 text-sm text-white/75">
                {copy.lead.map((sentence, index) => (
                  <span key={sentence} className="block">
                    {index > 0 ? " " : ""}
                    {sentence}
                  </span>
                ))}
              </p>
            </div>
          </div>
          {/* Desktop hands are sized as if both were shown (half the stage
              less the toolbar, at the hand's 1.1 aspect), so the hand keeps
              its size when the menu opens and the layout changes around it. */}
          <div className="relative mt-4 min-h-0 flex-1 @container">
            {/* The stage keeps its three columns in every state, so the
                hands never move; the one menu card floats over the left
                hand's column while that hand is away, over the hand not
                being edited, or fades out. */}
            <section
              aria-labelledby={titleId}
              className="relative h-full min-h-0"
            >
              <h2 id={titleId} className="sr-only">
                {copy.panels.design}
              </h2>
              {stage}
            </section>
            <aside
              className={`absolute top-0 w-[26rem] transition-[left,opacity,transform,height] duration-500 ${EASE} motion-reduce:transition-none ${
                menuHidden ?
                  "pointer-events-none scale-95 opacity-0"
                : "scale-100 opacity-100"
              } ${
                !view.both ? "left-[calc(25%-13rem)] h-full"
                : view.hand === "left" ? "left-[calc(75%-13rem)] h-[92%]"
                : "left-[calc(25%-13rem)] h-[92%]"
              }`}
              inert={menuHidden}
            >
              {menuCard}
            </aside>
          </div>
        </div>
      }

      <dialog
        ref={dialogReference}
        className="m-auto w-[min(92vw,24rem)] rounded-3xl bg-pearl p-6 text-burgundy shadow-2xl backdrop:bg-burgundy-deep/70 backdrop:backdrop-blur-sm"
      >
        <form method="dialog">
          <p className="font-serif text-2xl italic">
            {copy.toolbar.resetConfirm}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="submit"
              className={`${segment} border border-rose/60 text-burgundy hover:bg-rose/20`}
            >
              {copy.toolbar.cancel}
            </button>
            <button
              type="submit"
              onClick={reset}
              className={`${segment} bg-rose text-burgundy-deep hover:bg-rose-soft`}
            >
              {copy.toolbar.confirm}
            </button>
          </div>
        </form>
      </dialog>

      {toast && (
        <p
          role="status"
          className="rise fixed bottom-[max(5rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-pearl px-5 py-3 text-sm font-semibold text-burgundy shadow-xl"
          style={{ "--d": "0s" } as React.CSSProperties}
        >
          {toast}
        </p>
      )}

      {exporting && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 -z-10 size-px overflow-hidden opacity-0"
        >
          {SIDES.map((side) => (
            <HandDrawing
              key={side}
              side={side}
              hand={handOf(state, side)}
              prefix={`xp-${side}`}
              svgRef={(element) => {
                slots.current[side] = element ?? undefined;
              }}
            />
          ))}
          {allNails.map(({ side, finger }, index) => (
            <NailView
              key={`${side}-${String(finger)}`}
              design={nailOf(state, { side, finger })}
              form={handOf(state, side).form}
              prefix={`xp-tile-${String(index)}`}
              svgRef={(element) => {
                slots.current.tiles[index] = element ?? undefined;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { definitionOf, Designer, FINGER_NAMES };
