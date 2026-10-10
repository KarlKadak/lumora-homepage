# Nail design builder: specification

A new page where a client composes the nail set they want before their
appointment: a spread hand drawn in the hero's outline style, a menu that
changes length, shape, sharpness and colour, a per-nail design editor for
patterns, illustrations and rhinestones, a separately editable left hand, and
a download that produces a collage image of the result.

This document is the implementation brief. Nothing here is built yet.

## 1. Goals and constraints

- Runs entirely in the browser. The site is a static export (`output: "export"`),
  so there is no server, no upload and no persistence beyond the visitor's own
  browser. "Sending the design to the salon" means downloading an image (and,
  optionally, a share link that carries the design in the URL hash).
- Looks like the rest of the site: the hero's outline-only hand, the arch, rose
  strokes on burgundy, Cormorant titles, Manrope labels, the same rounded pill
  buttons. No new fonts, no new dependencies.
- Works on phones first. The desktop layout is the "menu left, hand right" one
  described in the request; the phone layout is a different arrangement that is
  actually usable with a thumb (section 5).
- Bilingual like the rest of the site (Estonian at the root, English under
  `/en/`), with all copy in `src/content/dictionary.ts`.
- Must pass `pnpm check` under the existing strict ESLint config (functional
  style, `no-let`, `prevent-abbreviations`, strict TypeScript, a11y strict).

## 2. Routes, metadata, navigation

| Locale | Path            | File                                |
| ------ | --------------- | ----------------------------------- |
| et     | `/kujundaja/`   | `src/app/(et)/kujundaja/page.tsx`   |
| en     | `/en/designer/` | `src/app/(en)/en/designer/page.tsx` |

Each page file is a thin wrapper like the existing ones: it renders
`<DesignerPage locale="…" />` from `src/components/designer-page.tsx`.

Metadata:

- Generalise `buildMetadata(locale)` in `src/content/metadata.ts` to
  `buildMetadata(locale, page)` where `page` is `"home" | "designer"`. It picks
  the title and description from the dictionary, sets `canonical` and the
  `languages` alternates to the page's own paths (`/kujundaja/` and
  `/en/designer/`), and keeps the home OG image.
- Add `localePagePath(locale, page)` next to `localePath` in the dictionary so
  the header language switch, sitemap and metadata share one source of paths.
- Add both routes to `src/app/sitemap.ts` (priority 0.7, weekly).

Navigation:

- Extract `Header`, `MobileDock`, `Footer`, `Wordmark`, `InstagramIcon` and
  the shared class strings (`roseButton`, `eyebrow`, `sectionTitle`) from
  `home-page.tsx` into `src/components/site-chrome.tsx`. Both pages import
  them. `Header` and `MobileDock` take a `home` prop (the locale's home path)
  so the anchor links become `/#sinu-aeg` and so on when not on the home page,
  and `Header` takes a `switchHref` prop so the language switch lands on the
  same page in the other language.
- Add a "Kujunda" / "Design" link to the header nav and to the mobile dock.
  The dock currently has three links and the contact pill; replace nothing,
  add the link as the fourth and let the labels shrink to `text-[0.7rem]` if
  it does not fit at 360 px wide.
- The designer page keeps the site header (sticky) and a compact footer; the
  mobile dock is not shown on the designer page because its bottom sheet
  occupies that space.

## 3. Hand drawing

### 3.1 Pose

The hero's hand (`src/components/hero-hand.ts`) is a jointed 3D model
projected orthographically, with the hand held up and the fingers curled. The
builder needs a different pose with the same look: the back of the hand
facing the viewer, fingers straight and spread, wrist running off the bottom
of the frame.

Refactor `hero-hand.ts` so the pose is data, not constants:

- Move the vector math, `Digit`, `limbOf`, `smoothPath`, `quadraticThrough`,
  `placePath`, `nailPoint`, `nailTransform` and the `buildHand` machinery into
  `src/components/hand-model.ts`. `buildHand` takes a `HandSpec`:

  ```ts
  interface HandSpec {
    digits: Readonly<
      Record<"thumb" | "index" | "middle" | "ring" | "pinky", Digit>
    >;
    view: {
      yaw: number;
      pitch: number;
      roll: number;
      extension: number;
      scale: number;
      wrist: Vec2;
    };
    closeUp?: { scale: number; wrist: Vec2 };
    // Nail outline in nail-local coordinates, for the silhouettes.
    nail: string;
  }
  ```

- `hero-hand.ts` keeps the hero's digits and view and re-exports
  `buildHand(yaw, zoom)` and `HAND` with their current signatures so
  `hero-scene.tsx` does not change.
- `src/components/builder-hand.ts` defines the flat pose: `curl: [0, 0, 0]`
  for every digit, `view: { yaw: 0, pitch: 0, roll: 0, extension: 0 }`,
  headings fanned out (thumb about −48°, index −14°, middle −3°, ring 7°,
  pinky 18°), knuckle bases spread a little wider than the hero's, and the
  thumb's `dorsal` unchanged so its nail reads as seen from the side the way a
  flat hand's thumb does. The wrist sits at the bottom centre of a
  `0 0 400 560` viewBox so the forearm leaves the frame.
- The nail outline is no longer a constant: `buildHand` receives the nail path
  through `HandSpec.nail` because the silhouettes (used as masks) depend on the
  chosen length and shape. The builder rebuilds the hand whenever the hand's
  form changes; this is cheap (the hero does it every frame).

### 3.2 Drawing and masks

`src/components/builder/hand-drawing.tsx` draws one hand as an SVG group:

- Same vocabulary as `HeroDrawing`: body sides, thumb web, five digit outlines
  with knuckle creases, the arch and its glow as a backdrop, three sparkles.
- Because the fingers are spread they never overlap, so the only occlusion is
  each nail hiding its own fingertip cap. One mask per nail (`white` rect
  minus that nail's silhouette) applied to that digit's outline group. The
  five-level `hero-behind-*` mask ladder is not needed.
- Every colour is a literal hex value from a `PALETTE` constant (the same
  values as `globals.css`), never a Tailwind class or `var(--…)`. This is what
  lets the export (section 8) serialise the live SVG as-is.
- The left hand is the same drawing inside `<g transform="scale(-1 1)
translate(-400 0)">`. Inside each nail frame the decoration group gets a
  second `scale(-1 1)` so designs appear exactly as placed in the editor (the
  nail outline is symmetric, so this flip is invisible).
- Nails are interactive: each nail is wrapped in a `<g role="button"
tabIndex={0} aria-label="Right hand, index finger">` with a hover/focus halo
  stroke. Activating a nail opens the design panel on that nail.
- Every element that the React state controls gets its attributes from props
  (no imperative `setAttribute` loop as in the hero). The builder is a plain
  controlled React tree; only the zoom transition (section 7.1) is animated
  imperatively.

Entrance: the outline draws in with the existing `nail-draw` class and
`delay()` offsets on first paint, honouring `prefers-reduced-motion`.

## 4. Nail form: length, shape, sharpness

Each is an integer 1–5. They are hand-level settings (one value for all five
nails of a hand), which matches how a set is actually done; per-nail colour
and decoration live in the design (section 6).

### 4.1 Geometry

`src/components/nail-form.ts` exports `nailOutline(form: NailForm): string`
in nail-local coordinates (the same space the hero's decor uses: x from −24 to
24, cuticle at y ≈ 52, tip towards negative y). The path uses only `M`, `L`,
`C` and `Z` with absolute coordinates, because `placePath` in `hand-model.ts`
understands exactly those (it treats any two-number command as a point).

Construction, with `f = (shape − 1) / 4` (0 pointed → 1 flat) and
`k = (sharpness − 1) / 4` (0 crisp → 1 fully rounded):

1. Cuticle and bed: identical to the hero's almond. Start at (−24, 52), the
   rounded cuticle `C24 64 −24 64 −24 52` closes the shape at the bottom, and
   the bed sides run straight from y = 52 up to y = −6.
2. Tip line: `yTip = −(30 + 20 × (length − 1))`, so lengths 1–5 end at −30,
   −50, −70, −90, −110. Length 3 is today's almond.
3. Tip half-width: `h = 24 × f`. The two tip corners are at (±h, yTip).
4. Sides: from (±24, −6) to (±h, yTip) as cubics whose control points bow
   outward by `6 × (1 − f)` at a third and two thirds of the way, so pointed
   shapes have the almond's convex sides and square shapes have straight
   sides.
5. Rounding: each tip corner is rounded with radius `r = k × R`, where
   `R = 22` clamped to the shorter of the two adjoining segments. At `h = 0`
   the two corners coincide and the rounding produces a dome; at `h = 24` and
   `k = 1` it produces a half circle. Rounding is done by the usual
   "trim both edges by r, join with a cubic through the corner" helper.
6. Output the polygon as `M … C … L … Z`.

Named presets that the grid approximates, used in slider value text and in
the export captions:

| shape \ sharpness | 1 (crisp) | 3             | 5 (rounded) |
| ----------------- | --------- | ------------- | ----------- |
| 1 (pointed)       | Stiletto  | Soft stiletto | Almond      |
| 3                 | Coffin    | Soft coffin   | Oval        |
| 5 (flat)          | Square    | Squoval       | Round       |

Intermediate values use the nearest name. The hero's current almond is
`{ length: 3, shape: 1, sharpness: 5 }` and is the default.

### 4.2 Placement on the finger

`nailOf` in the hand model keeps the nail's cuticle end on the last bone, so a
longer nail simply extends past the fingertip (which the mask hides). The
base/fresh rectangles behind the nail (`x −30, y −75, w 60, h 140` in the
hero) become `y −130, h 195` so length 5 is fully painted.

### 4.3 Controls

Three `<input type="range" min="1" max="5" step="1">` sliders styled as a
rose track with five tick dots and the preset name under the thumb.
`aria-valuetext` reads e.g. "3 of 5, oval". Changing a slider updates the
hand live (no apply button). Length shows the nail growing from the tip.

## 5. Layout and the menu

### 5.1 Desktop (`md` and up)

The workspace fills the viewport under the sticky header
(`min-h-[calc(100dvh-4.5rem)]`), burgundy background like the hero.

- **Right hand only (default).** Two columns: a `22rem` menu column on the
  left, the stage on the right with the right hand in its arch, centred.
- **Both hands.** Pressing "Left hand" in the toolbar turns the stage into two
  arches: the left hand in the left column (where the menu was), the right
  hand on the right. The menu becomes a floating card (`absolute`, same
  `22rem` width, `max-h-[80%]`, scrollable, translucent pearl with blur) laid
  over the hand that is _not_ being edited. It opens over the right hand
  editing the left, as requested; switching the hand segment in the menu
  header slides the card over to cover the other hand, so the hand being
  edited is always visible. The card has a drag-free fixed position; no
  free-form dragging.
- **Menu hidden.** The "Hide menu" toolbar button collapses the menu to a
  single rose pill ("Menu") in the bottom-left corner of the stage and the
  stage shows both hands side by side, unobstructed. The pill restores the
  previous mode.

Stage toolbar (top of the stage, right-aligned pills): `Left hand` (toggle,
`aria-pressed`), `Hide menu` / `Show menu`, `Undo`, `Reset`, `Download`.
`Reset` asks for confirmation in a small `<dialog>`.

### 5.2 Phone (below `md`)

A stacked layout, one hand at a time:

- **Stage** on top, `h-[46dvh]`, sticky under the header. A segmented control
  above the arch switches `Right | Left`; the stage shows the active hand.
  The toolbar collapses to icon buttons with `aria-label`s (download, undo,
  reset, hide menu) in a row under the segment.
- **Menu** as a bottom sheet pinned to the bottom of the viewport: a tab bar
  with five tabs (Length, Shape, Sharpness, Colour, Design) and the active
  tab's control in a `max-h-[40dvh]` scrollable area. The sheet has a grab
  handle that toggles between a peek state (tab bar only) and the open state.
- **Hide menu** collapses the sheet to a pill and the stage grows to show
  both hands side by side (each at half width) for an overview.
- **Design mode** (section 7) replaces the stage content with the zoomed
  nail; the finger strip lives at the top of the sheet.

Hit targets are at least 44 × 44 px everywhere, including the slider thumbs
and the element handles.

### 5.3 Menu contents

Menu header: a hand segment (`Right | Left`, only enabled once the left hand
exists or in both-hands mode), and a one-line hint ("Changes apply to all five
nails of this hand").

Sections, as an accordion on desktop (one open at a time, the existing
`Accordion` pattern generalised to arbitrary children) and as tabs on phones:

1. Length slider.
2. Shape slider.
3. Sharpness slider.
4. Colour (section 6.2).
5. Design (section 7), which opens the design mode on the selected finger
   (default: the index finger).

## 6. State model

`src/components/builder/state.ts`:

```ts
type Side = "right" | "left";
type Finger = 0 | 1 | 2 | 3 | 4; // thumb … pinky, like HAND.nails
type Level = 1 | 2 | 3 | 4 | 5;

interface NailForm {
  length: Level;
  shape: Level;
  sharpness: Level;
}

// A solid hex colour or a special finish from the gradient catalogue.
type Paint = { kind: "solid"; hex: string } | { kind: "finish"; id: string };

interface NailElement {
  id: string; // crypto.randomUUID()
  kind: "pattern" | "illustration" | "stone";
  variant: string; // catalogue key
  x: number;
  y: number; // nail-local, centre of the element
  scale: number; // 1 = catalogue size
  rotation: number; // degrees
  flip: boolean;
  color: string; // hex; patterns may also use color2
  color2?: string;
}

interface NailDesign {
  paint: Paint;
  elements: readonly NailElement[];
}

interface HandState {
  form: NailForm;
  nails: readonly NailDesign[];
} // length 5

interface DesignerState {
  right: HandState;
  // undefined means "mirror the right hand": the left hand is derived until
  // the visitor first edits it, which materialises a copy.
  left: HandState | undefined;
}

interface ViewState {
  hand: Side; // the hand the menu edits
  both: boolean; // desktop: show both arches
  menu: "open" | "hidden";
  panel: "length" | "shape" | "sharpness" | "color" | "design";
  designing?: { side: Side; finger: Finger; selected?: string };
}
```

- `DesignerState` goes through a reducer with an undo stack (last 50 states,
  `Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z` to redo); `ViewState` is separate and not
  undoable.
- "Match right hand" in the left hand's menu header sets `left` back to
  `undefined`.
- The reducer is pure and the default state is deterministic, so the page is
  server-rendered with the default right hand (static export) and hydrates
  cleanly. A persisted draft (section 9) is applied in an effect after mount.

### 6.1 Equality

`sameDesign(a, b)` compares `paint` and the element lists with ids stripped
and numbers rounded to one decimal; `sameNail` also compares the owning hand's
`form`. The export uses these to decide whether the per-nail tile row is
needed (section 8).

### 6.2 Colour panel

Applies to all five nails of the active hand (in design mode the same panel is
embedded in the design panel and applies to the one nail).

- A swatch grid of curated polishes: the brand colours, the plain hex shades
  from `nail-finishes.tsx` (cherry, nude, ink, lavender, sage…), and a row of
  special finishes (chrome, holo, cat-eye, aurora, galaxy, ombré, sunset,
  candy, ocean) which are `Paint { kind: "finish" }` and render with the
  existing gradient defs.
- A "Custom" swatch opens a native `<input type="color">` (good enough on
  every modern phone and desktop; no colour library). The last six custom
  picks are kept in a "Recent" row (localStorage).
- Each swatch is a `FinishSwatch`-style nail preview with a label; the
  selected one shows a ring.

The gradient and decor defs from `HeroFinishDefs` are reused on the builder
page. Move them and the decor data into `src/components/nail-finishes.tsx`'s
own `FinishDefs` export (it already is; just drop the hero-specific id
assumption by giving `HeroFinishDefs` an `idPrefix` prop defaulting to
`hero`). The builder uses prefix `nd`.

## 7. Design mode

Entered from the Design section, from clicking a nail on the hand, or from
the finger strip. `view.designing = { side, finger }`.

### 7.1 Zoom

The stage tweens the SVG `viewBox` from the hand's full frame to the selected
nail's bounding box (padded 30 %) over 450 ms with the hero's `inOut` easing,
then crossfades in the editor overlay. Leaving design mode plays it in
reverse. With `prefers-reduced-motion` the viewBox is set directly. During
editing the nail is drawn face-on in nail-local coordinates (a dedicated
`<svg viewBox="-40 -140 80 220">`) rather than foreshortened on the finger, so
the thumb is just as editable as the others; the hand behind is dimmed.

### 7.2 Editor canvas

- The nail outline, its paint, and its elements in z order (array order).
  Elements are clipped by the nail path; the clip is applied to the group so
  elements can bleed over the edge (a french tip, a half-moon).
- Tap/click an element to select it; the selection shows a dashed bounding
  box, a rotate handle above and a scale handle at the bottom-right corner,
  all at least 44 px on screen.
- Drag to move with Pointer Events (`setPointerCapture`), coordinates mapped
  through `svg.getScreenCTM().inverse()`. Position updates are batched per
  animation frame. The element's centre is clamped to the nail's bounding box
  plus 10 units so nothing is lost off-nail.
- Pinch on touch scales the selected element; two-finger twist rotates it.
  These are conveniences; the property row below is the accessible path.
- Keyboard: elements are in the tab order (`tabIndex=0`, `role="button"`,
  `aria-label="Heart, rose, at 40 % from the top"`); arrows nudge 1 unit,
  Shift+arrows 5; `[`/`]` rotate 15°; `+`/`−` scale; Delete removes.
- Patterns are not draggable (they cover the nail); they have colour, flip and
  a size/offset slider where it makes sense (french tip depth, half-moon
  height, stripe angle).

### 7.3 Design panel

Under (phone) or beside (desktop) the canvas:

1. **Finger strip**: ten mini nails (left 1–5, right 1–5) each showing its
   current design; the edited one is ringed. Tapping switches the editor
   (with the zoom tween retargeting if the hand changes).
2. **Base colour**: the colour panel from 6.2, scoped to this nail.
3. **Add element**: three tabs
   - Patterns: french tip, half-moon, ombré (two colours), diagonal split,
     chevron, stripes, polka dots, glitter, marble, leopard, snow, stars,
     hearts scatter, gold foil.
   - Illustrations: heart, star, sparkle, daisy, moon, butterfly, leaf,
     cherry, bow, smiley, lightning, bat, snowflake, evil eye.
   - Rhinestones: round in XS/S/M/L (5, 8, 11, 16 units across), teardrop
     M/L, square S/M; colours crystal, aurora borealis (AB), rose, gold,
     black, emerald. Drawn as a faceted disc: a radial-gradient body, a
     darker rim, two white highlight slivers.
     Tapping a tile adds the element at the nail's centre (stones stack with a
     small random offset so repeated taps do not pile up invisibly) and
     selects it.
4. **Selected element**: size slider (0.4–3×), rotation slider (−180–180),
   colour swatches (and a second colour for two-tone patterns), Flip,
   Duplicate, Bring forward / Send back, Delete.
5. **Copy this design to**: chips for the other four fingers of this hand,
   "All on this hand", the five fingers of the other hand, "All on the other
   hand", "All nails". Copies to the other hand mirror x by default; a
   "Mirror" checkbox next to the chips turns that off. Copying into the left
   hand while it is still mirrored materialises it first.
6. **Done** returns to the hand view.

Element catalogue: `src/components/builder/elements.tsx` exports the catalogue
(`ELEMENTS: Record<kind, readonly ElementDefinition[]>`), `<ElementDefs
prefix>` for the shared gradients and symbols, and `<ElementView element>`
which renders one placed element as `<g transform="translate(x y) rotate(r)
scale(s · flip)"><use href="#…" fill={color} /></g>`. Illustrations are
single-colour paths from a hand-drawn set in the site's line style (stroked
outlines with a fill), sized to about 16 units so scale 1 looks right on a
nail. Existing decor from `nail-finishes.tsx` (french, half-moon, polka,
glitter, stars, foil, snow, hearts, leopard, marble, stripes) is wrapped as
patterns rather than redrawn; they gain a `fill` parameter via
`currentColor`.

## 8. Download

Toolbar `Download` produces one PNG, `lumora-nails-YYYY-MM-DD.png`
(`lumora-kyyned-…` in Estonian), via an offscreen canvas:

1. For each hand, serialise the live hand SVG: `cloneNode(true)`, strip the
   interactive wrappers and halos, append the `<defs>` the page shares
   (finish and element defs), set explicit `width`/`height` on the root
   (Safari needs them), wrap in a `Blob` of type `image/svg+xml;charset=utf-8`
   and load it into an `Image`. Because the drawing uses literal colours and
   no CSS classes, nothing else needs inlining.
2. For each of the ten nails, do the same with a face-on nail SVG (the editor
   canvas's renderer, without the handles).
3. Compose on a `2400 × 1600` canvas (2× of 1200 × 800):
   - Background: the hero's radial burgundy gradient.
   - Header: "Lumora" in Cormorant 500 and "Nail Lounge" in Manrope tracked
     caps, drawn with `fillText` (the fonts are already loaded in the
     document; wait for `document.fonts.ready`), plus the date on the right.
   - Middle: left hand and right hand side by side in their arches, each
     captioned with the hand's form, e.g. "Pikkus 3 · Mandel" / "Length 3 ·
     Almond".
   - Bottom row, only when `new Set(allNails.map(hash)).size > 1`: ten nail
     tiles in two groups of five (left, right), labelled with the finger
     name. If every nail is the same the canvas height shrinks to 1100 so
     there is no empty band.
4. `canvas.toBlob` → object URL → a temporary `<a download>` click. On
   devices where `navigator.canShare?.({ files })` is true (iOS, Android), a
   second button "Share" offers the Web Share sheet with the same file, since
   iOS Safari opens rather than saves `download` links.

While composing, the button shows a spinner and is disabled; failures surface
in a toast ("Could not create the image") rather than silently.

## 9. Persistence and sharing

- **Draft**: `DesignerState` is written to `localStorage` under
  `lumora-designer-v1` on every change (debounced 300 ms) and restored after
  mount. A "Reset" clears it. Wrapped in try/catch for private mode.
- **Share link (optional, phase 3)**: `#d=` plus a base64url of a compact JSON
  encoding of `DesignerState` (keys shortened, numbers rounded). A "Copy link"
  button next to Download writes it to the clipboard. On load, a hash wins
  over the stored draft. This is the cheapest way for a client to send the
  design to the salon without a backend; the salon opens the link and sees the
  set. Keep the payload under 4 kB (ten nails with a dozen elements each fits).

## 10. Copy (dictionary)

Add `designer` to `Dictionary` with at least: `meta` (title, description),
`title`, `lead`, `nav` label, `hands` (right, left, both, matchRight),
`toolbar` (leftHand, hideMenu, showMenu, undo, redo, reset, resetConfirm,
download, share, copyLink, linkCopied), `panels` (length, shape, sharpness,
color, design), preset names (stiletto, softStiletto, almond, coffin,
softCoffin, oval, square, squoval, round), `color` (custom, recent, finishes),
`design` (addElement, patterns, illustrations, stones, size, rotation, flip,
duplicate, forward, back, delete, copyTo, allThisHand, otherHand,
allOtherHand, allNails, mirror, done), finger names (thumb, index, middle,
ring, pinky), element names, `export` (caption pieces, failure toast) and
a11y strings (nail button label pattern, element label pattern, live region
messages like "Copied to all nails").

Estonian titles: "Kujunda oma küüned" / meta "Kujunda oma küüned enne
külastust | Lumora Nail Lounge". English: "Design your nails" / "Design your
nails before your visit | Lumora Nail Lounge".

## 11. Accessibility

- All controls are native (`range`, `button`, `dialog`, `input type=color`)
  with labels; no custom slider widgets.
- A visually hidden `aria-live="polite"` region announces hand-level changes
  ("Length 4", "Colour cherry applied to all nails") and copy actions.
- Nails and placed elements are keyboard reachable and operable (section 7.2).
- Focus is moved into the design panel when design mode opens and back to the
  nail that opened it when it closes.
- Colour is never the only signal: the selected swatch has a ring and a
  check, the active finger a ring and a label.
- Everything honours `prefers-reduced-motion` (no zoom tween, no draw-in).

## 12. File plan

```
src/app/(et)/kujundaja/page.tsx
src/app/(en)/en/designer/page.tsx
src/components/site-chrome.tsx          header, dock, footer, shared classes (moved out of home-page.tsx)
src/components/designer-page.tsx        server component: chrome + <Designer locale>
src/components/hand-model.ts            generic hand builder (moved out of hero-hand.ts)
src/components/hero-hand.ts             hero pose only, same exports as today
src/components/builder-hand.ts          flat spread pose
src/components/nail-form.ts             nailOutline(form), preset naming
src/components/builder/designer.tsx     "use client" root: state, view, layout switch
src/components/builder/state.ts         types, reducer, undo, equality, (de)serialisation
src/components/builder/storage.ts       localStorage + hash
src/components/builder/stage.tsx        arches, toolbar, zoom tween
src/components/builder/hand-drawing.tsx one hand as SVG, interactive nails
src/components/builder/menu.tsx         desktop accordion / phone sheet shell
src/components/builder/form-sliders.tsx length, shape, sharpness
src/components/builder/color-panel.tsx
src/components/builder/design-panel.tsx finger strip, add, properties, copy
src/components/builder/nail-editor.tsx  face-on canvas, drag, handles
src/components/builder/elements.tsx     catalogue, defs, ElementView
src/components/builder/export.ts        SVG → canvas → PNG, share
src/content/dictionary.ts               designer section, localePagePath
src/content/metadata.ts                 buildMetadata(locale, page)
src/app/sitemap.ts                      two more URLs
```

`home-page.tsx` shrinks accordingly; `hero-scene.tsx` only changes its import
path for the hand model if at all.

## 13. Implementation order

1. **Foundation**: `site-chrome.tsx` extraction, routes, metadata, dictionary
   section, empty designer page with chrome. `pnpm check` green.
2. **Hand**: `hand-model.ts` refactor with the hero unchanged visually;
   `builder-hand.ts`; `nail-form.ts` with the 25 forms; `hand-drawing.tsx`
   with masks and interactive nails; form sliders wired to state.
3. **Layout**: desktop columns, both-hands mode, floating menu, hide menu;
   phone stage + bottom sheet; toolbar with undo/reset.
4. **Colour**: swatches, finishes, custom, recent; left hand materialisation.
5. **Design mode**: zoom tween, editor canvas with drag and handles, element
   catalogue (patterns first since they reuse existing decor, then stones,
   then illustrations), properties, copy chips with mirroring.
6. **Export**: serialisation, collage, share sheet, caption text.
7. **Persistence and polish**: localStorage draft, share link, live region
   copy, reduced motion pass, 360 px and 1280 px checks.

Each step ends with `pnpm check`. There is no test runner in the repo; the
pure modules (`nail-form.ts`, `state.ts`, `export.ts` layout maths) should be
written so they could be unit-tested later (no DOM access, no React).

## 14. Acceptance checklist

- [ ] `/kujundaja/` and `/en/designer/` build in the static export and are
      listed in the sitemap with correct alternates.
- [ ] Right hand renders server-side with the default almond set; no
      hydration warnings.
- [ ] Each of length, shape, sharpness updates all five nails live; the 25
      shape/sharpness combinations look like their preset names and length 1–5
      grow the free edge only.
- [ ] Colour panel applies to the active hand; custom colour and finishes
      work; the hero's gradients render on the builder page.
- [ ] "Left hand" shows a mirrored hand that follows the right hand until
      edited, then is independent; "Match right hand" relinks it.
- [ ] Desktop: menu left in single mode, floating over the non-edited hand in
      both-hands mode; hide menu shows both hands unobstructed.
- [ ] Phone (360 × 740): one hand on the stage, bottom sheet with tabs, all
      controls reachable without horizontal scroll; hide menu shows both hands.
- [ ] Design mode zooms to the nail, allows adding, dragging, scaling,
      rotating, recolouring, reordering and deleting elements with pointer and
      keyboard; copying to fingers, hands and all works, with mirroring.
- [ ] Download produces a PNG with both hands; the nail tile row appears only
      when at least two nails differ; captions use the current language.
- [ ] Share sheet appears on iOS/Android; download link works on desktop.
- [ ] Undo/redo, reset with confirmation, draft restore after reload.
- [ ] Reduced motion: no tweens; keyboard-only run-through completes every
      flow; `pnpm check` passes.

## 15. Assumptions and open points

- **Menu position in both-hands mode.** The request says the menu moves on
  top of the right hand. This spec does that, and additionally moves it over
  the left hand when the visitor switches to editing the right hand, so the
  edited hand is never covered. If the literal behaviour is preferred, drop
  the slide and keep the card over the right hand.
- **Form is hand-level, not per nail.** Length, shape and sharpness apply to
  all five nails of a hand; colour and decoration are per nail. If per-nail
  length is wanted later, `NailForm` moves into `NailDesign` and the sliders
  gain a scope toggle; the geometry already supports it.
- **Default left hand mirrors the right.** This keeps the download meaningful
  (it always has both hands) without forcing the visitor to design the left
  hand. Flagged in the UI with "Follows the right hand" until edited.
- **No backend.** Sending the design to the salon is the downloaded image or
  the share link. If a booking form is added later, the share link payload is
  the thing to attach.
- **Illustration set.** Fourteen glyphs are proposed; they need to be drawn.
  Start with the ones already in the codebase (heart, sparkle/star, bat,
  snowflake-as-sparkle) and add the rest as time allows.
