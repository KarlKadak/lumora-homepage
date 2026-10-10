# Nail designer: the chosen hand pose

Companion to `nail-designer-spec.md`, section 3. This is the pose the builder
hand (`src/components/builder-hand.ts`) must reproduce. It was chosen from
rendered candidates, so the numbers below are final, not suggestions. The
reference render is `nail-designer-hand.svg` (same folder); the implementation
should match it visually.

Reading of the pose: a flat right hand seen from the back, fingers close
together with even gaps, a faintly relaxed curl, slender digits, a narrow palm
and forearm, the thumb held near the hand, a faint wrist crease, and strokes a
quarter lighter than the hero's.

## Hand model

Everything is expressed in the hero model's terms (`src/components/hero-hand.ts`:
`Digit`, `Vec3`, `lean`, `PALM = -20`, `WEB = 9`, `THENAR = -8`). Values not
mentioned (`starts`, `root`, `nailWrap`, `dorsal`, bone lengths) are the hero's.

| Digit  | base               | heading                    | curl        | radii (hero × 0.92)            |
| ------ | ------------------ | -------------------------- | ----------- | ------------------------------ |
| thumb  | `[-21, 2, -10]`    | `[-0.5034, 0.8056, -0.22]` | `[0, 6, 8]` | `[12.42, 8.464, 7.36, 5.704]`  |
| index  | `[-26.22, 74, -7]` | `lean(-9)`                 | `[2, 5, 6]` | `[7.912, 6.624, 5.704, 4.876]` |
| middle | `[-8.74, 79, -7]`  | `lean(-3)`                 | `[2, 5, 6]` | `[7.176, 6.624, 5.888, 4.968]` |
| ring   | `[8.74, 76, -7]`   | `lean(3)`                  | `[2, 5, 6]` | `[6.716, 6.256, 5.612, 4.692]` |
| pinky  | `[27.94, 67, -7]`  | `lean(9)`                  | `[2, 5, 6]` | `[6.256, 5.428, 4.784, 4.048]` |

- The thumb heading is `[sin(−32°) × 0.95, cos(−32°) × 0.95, −0.22]`; its
  `dorsal` stays `[-0.8, 0, 0.6]` so the nail reads from the side.
- Finger bases are the hero's x values × 0.86 with ±3 (index/pinky) or ±1
  (middle/ring) added, i.e. a palm 14 % narrower than the hero's.
- Bone lengths are the hero's: thumb `[46, 30, 26]`, index `[40, 24, 21]`,
  middle `[44, 27, 22]`, ring `[41, 26, 21]`, pinky `[31, 20, 18]`.

### View

```ts
view: { yaw: 0, pitch: 0, roll: 0, extension: 0, scale: 2.15, wrist: [233.95, 548] }
```

The wrist x is not 200: the hand is centred by its drawn extent (digit
outlines plus nail silhouettes), whose horizontal centre then lands on x = 200
in a `0 0 400 560` viewBox. Implement this as a one-off computation in
`builder-hand.ts` (build once at x = 200, measure, shift), or hard-code
233.95 if the geometry above is used verbatim. Rebuilding for a different nail
form must not re-centre; the hand must not shift when the sliders move.

### Body and extras (generalisations of hero constants)

- Forearm half-width 25 instead of 27.5. The forearm points become
  `[-25, -170]`, `[-22.5, -70]`, `[-22, -24]` on the thumb side and
  `[26, -170]`, `[24, -70]`, `[23, -24]` on the little-finger side (hero: ±27.5
  / 25 / 24.5 and 28.5 / 26.5 / 25.5). `heelSide` reach stays 24.
- Joint waist 0.08 and fingertip cap bulge 0.15 as in the hero (unchanged).
- Wrist crease: one extra detail path on the body layer, in screen space with
  `k = view.scale`, `(wx, wy) = view.wrist`, `y = wy − 4k`:
  `M(wx − 21k) y Q wx (y + 4k) (wx + 20k) (y − k)`, stroke width 0.9 × line,
  opacity 0.4.
- The mirrored left hand is the same drawing inside
  `transform="scale(-1 1) translate(-400 0)"` (spec 3.2).

## Drawing

- Line factor 0.75 relative to the hero. Stroke widths: body sides 1.125, web
  0.9 (opacity 0.7), digit outlines 1.125, creases and wrist crease 0.675
  (opacity 0.4), nail rim 0.9, cuticle 0.525 (opacity 0.5). The gloss stroke
  stays 1.4 (white, opacity 0.15).
- Stroke colour pearl `#fbf5f3`, arch fill `#2a0510` at 0.6, arch stroke
  `#cf8e80` at 0.25 (1.5), inner arch `#cf8e80` at 0.15 (1).
- Arch for the 560-high frame:
  `M0 200A200 200 0 0 1 400 200V520Q400 560 360 560H40Q0 560 0 520Z`, inner
  `M12 200A188 188 0 0 1 388 200V518Q388 548 358 548H42Q12 548 12 518Z`.
- Glow: radial gradient at (200, 360), r 200, `#cf8e80` 0.28 → 0.
- Sparkles at (318, 150, 9), (92, 128, 6), (340, 300, 5), fill `#ebc9c1`.
- Creases and finger webs are kept (both on).
- Nails in the reference are the hero's almond with a pale `#fbf5f3` 0.15
  fill; in the builder the nail path comes from `nailOutline(form)`.
