# סיון חבלצקי — landing page

Static implementation of the Figma frame **`Html → Body` (`8841:2`)** from
*Inbals-Playground* (`mucFvGkR4fDRnrEBE57C0b`), including the two open-state
accordion references (`8879:16`, `8879:185`).

Semantic HTML5 + modern CSS + a single vanilla-JS file. No build step, no
dependencies, no framework.

```
index.html
styles.css
script.js
assets/
  fonts/        ← Heebo, Assistant, Frank Ruhl Libre (bundled, WOFF2)
  icons/        ← 4 SVGs still to export from Figma
  img/          ← 13 exported images (wired in)
```

## Running it locally

The page must be served over HTTP (fonts and `@font-face` will not load from
`file://`). Any static server works:

```bash
cd <this folder>
python3 -m http.server 8000
# then open http://localhost:8000
```

Node alternative: `npx serve .` or `npx http-server -p 8000`.

## Assets

The 13 images you exported are wired in and referenced by their original
filenames, so the `assets/img/` folder works exactly as you arranged it.

| File | Where it is used |
|---|---|
| `SivanImage.png` (388×442) | hero portrait |
| `Green Stripe.png` (1920×130) | leaf band closing the hero |
| `Scribbleback.png` (478×150) | offer-card header in the INTRO section |
| `pips1.png` … `pips6.png` (615×154) | the six open-state photos in the RESULTS accordion, in Figma order |
| `Papertexture.png` (1184×662) | RESULTS section background, the quote-card background, and the shared sheet behind the recommendation carousel |
| `Logotype.png` (34×43) | header logo mark |
| `logotypebrown.png` (38×48) | footer logo mark |

Two notes on how they are used:

* `Papertexture.png` already carries its low opacity in the alpha channel, so
  it is rendered at full opacity rather than the `opacity: 0.1` the Figma layer
  used — double-dimming it would have made it invisible.
* `Image.png` is a fully transparent 486×356 export (the decorative overlay
  layer inside the quote card, which is empty). It is not referenced; the quote
  card uses `Papertexture.png` over the tan fill instead.

### Still missing — 4 SVG icons

`assets/icons/` is still empty. These four are vectors, so they weren't in the
image batch:

| File | Figma node | Layer |
|---|---|---|
| `arrow.svg` | `8841:294` | arrow inside the hero CTA (18 × 18) |
| `check-light.svg` | `8879:176` | checkmark on the **open** accordion badge (18 × 18) |
| `check-dark.svg` | `8843:1803` | checkmark on **closed** accordion badges (18 × 18) |
| `lock.svg` | `8843:2081` | padlock beside the contact-form privacy note (16 × 16) |

Until they land, `styles.css` §17b paints plain CSS-geometry stand-ins for the
checkmark and the CTA arrow so nothing reads as broken. Those rules use
`:has(img.is-missing)`, so the moment the real SVGs exist they take over and the
stand-ins disappear on their own — no code change needed.

The `bar-gradient.png` behind the קידום / העצמה / שימור bar (node `8843:1624`)
also wasn't in the batch; a CSS gradient stands in for it and the PNG layers on
top automatically if you add it later.

## Fonts

| Figma font | Status |
|---|---|
| **Heebo** (400/500/600/700/800) | ✅ bundled — `assets/fonts/Heebo.woff2`, variable, self-hosted |
| **Carmela** (display headings) | ⚠️ commercial, not redistributable — falls back to **Assistant** at weight 300, the closest freely-licensed Hebrew face |
| **Hillel CLM** (logo wordmark) | ⚠️ not obtainable here — falls back to **Frank Ruhl Libre** |

`@font-face` rules for `Carmela.woff2` and `HillelCLM.woff2` are already in
`styles.css`. Drop the licensed web-font files into `assets/fonts/` with those
exact names and they take over automatically — no CSS change needed.

## Contact form

Submissions are relayed to **inbal.bruker@tipranks.com** through
[FormSubmit](https://formsubmit.co) — no account, no backend, works on any
static host.

The form posts to FormSubmit's **alias** for that address
(`1cec372af7792b79c18218aa4c4fcdd2`) rather than the address itself, so the real
inbox isn't exposed in the page source. The alias is used in both `action` and
`data-endpoint` on `.form`.

> ### Activation is **per domain** — read this before launch
>
> FormSubmit activates a form for *the specific origin the submission came
> from*, not just for the destination address. Its setup email says so
> explicitly: *"making forms on **https://your-domain/** functional"*.
>
> So every origin that hosts this page needs its own one-time activation:
> `http://localhost:8000` while developing, and the real domain once live.
> Activating one does **not** activate the other.
>
> Until an origin is activated, FormSubmit answers `HTTP 200` with
> `{"success":"false", "message":"This form needs Activation…"}` and drops the
> submission — which is exactly why the page judges success by the JSON flag
> rather than the status code.

**The launch checklist:**

1. Deploy the page to its real domain.
2. Submit the form once from that domain.
3. Open the FormSubmit email — check it names *your* domain — and click
   **Activate Form**.
4. Submit again to confirm a real message arrives.

Skipping step 3 means the live site silently refuses every enquiry.

**Testing locally:** serve over `http://localhost:8000` and activate that
origin the same way. Opening the file directly via `file://` will not work —
the origin is `null` and there is nothing for FormSubmit to bind to.

To change the destination address later: submit once against the new address,
click "Activate Form" in the mail it sends, then swap the new alias into both
attributes. Corporate filters often quarantine that setup mail — check spam. If
it never arrives, ask IT to allowlist `formsubmit.co`, or move to a provider
with a proper account and dashboard (Formspree, Web3Forms); that is a one-line
change to the same two attributes, with no JS edits.

How it behaves:

* With JS, the form posts to the AJAX endpoint via `fetch`, so the visitor
  never leaves the page. The button disables and reads "שולח…", then an inline
  status message confirms success (and the form clears) or reports failure with
  a `mailto:` fallback to the same address. The form is *not* cleared on
  failure, so nothing the visitor typed is lost.
* Success is decided by the JSON `success` flag, **not** by the HTTP status —
  FormSubmit returns 200 even when it refuses a submission. When it refuses,
  the exact reason is logged to the browser console as
  `[contact form] rejected by the mail relay: …`, which is the first place to
  look if mail stops arriving.
* Without JS or `fetch`, the plain `action` attribute posts to FormSubmit
  normally and the browser lands on its confirmation page.
* Required fields are שם מלא and אימייל, enforced by native browser validation.
* A hidden `_honey` field acts as a spam trap; `_captcha=false` disables
  FormSubmit's own captcha step so genuine visitors aren't interrupted.

Two things you may want to change in `index.html`:

* **`CONTACT_EMAIL` in `script.js`** still holds the plain address — it feeds
  only the `mailto:` link offered when a submission fails, so a visitor always
  has a way to reach you. That does put the address in the JS source; delete
  the fallback if keeping it out of the page entirely matters more than
  catching failed submissions.
* **Add `_next`** with the absolute URL of a thank-you page if you want the
  no-JS fallback to return to your own site instead of FormSubmit's page.

To move to a different provider later, change the `action` and `data-endpoint`
on `.form` — no JS changes needed.

## Placeholder links that still need real URLs

| Location | Current | Needs |
|---|---|---|
| Logo (`.logo`) | `href="#hero"` | real home URL if the logo should leave the page |

All other links are in-page anchors (`#hero`, `#intro`, `#challenge`, `#route`,
`#results`, `#recommendations`, `#contact`) and resolve correctly — the Figma
file defines no external destinations.

## Notes on the implementation

**Direction.** The page is `dir="rtl"`, so Figma's left/right positioning is
expressed as logical flow rather than absolute offsets. Section order, column
order and inline order all match the frame.

**Layout.** `--shell-max: 1240px` with `28px` gutters reproduces the 1184px
content column. Above 1200px the CHALLENGE / ROUTE / RESULTS / RECOMMENDATIONS /
CONTACT sections carry the frame's exact `min-height` (1020 / 1020 / 1266 /
1344 / 938) with centred content, so section heights match the design; below
that they collapse to fluid padding.

**Tablet (768–1199px)** keeps the two-column structure — hero, intro,
challenge, route and contact all stay side by side, with the desktop
`flex: 0 1 <width>px` bases rebalanced and `min-width` floors so no column
collapses below a readable size. The one exception is RESULTS: the quote card
needs real width, so that pair stacks below 920px. The navigation still
collapses to the disclosure menu below 1200px, since seven links plus the CTA
don't fit.

**Phones (<768px)** stack every grid into one column, 36px apart. The desktop
`flex-basis` values must be reset when stacking: in a column flex container
`flex-basis` sizes the *main* axis, so an unreset base would lock each block to
its desktop width as a fixed **height** and leave a tall band of dead space
under short content.

The hero credential tags stay a **wrapping horizontal row at every size**,
falling to two lines on phones rather than becoming a vertical list.

**Full-screen hero.** `.hero` is `min-height: calc(100svh - var(--header-h))`
with its content vertically centred, so the header plus the hero come to
exactly one screen. `--header-h` is published from the header's real
`offsetHeight` by `script.js` (recomputed on resize and after webfonts load),
with an 86px CSS fallback; `svh` keeps it honest on mobile browsers whose
chrome hides on scroll. The Figma breathing room now comes from centring
inside that height rather than a large fixed padding, which is what stopped
short or landscape windows getting a dead band above the headline. On phones
the portrait is sized from viewport height (`clamp(160px, 28vh, 300px)`) so the
stacked hero still resolves to one screen. Verified exact at 1440×900,
1280×800, 1024×768, 768×1024, 430×932, 393×852, 390×844 and 375×812; below
that — very short or landscape phones — content genuinely needs more room and
the hero grows rather than clipping.

**Accordions.** Both use `aria-expanded` / `aria-controls` / `role="region"`,
open one item at a time, and support <kbd>Enter</kbd>/<kbd>Space</kbd>,
<kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>. Panels animate via
`grid-template-rows: 0fr → 1fr`, so nothing is ever clipped and no fixed
expanded height is hard-coded. Open/closed styling (shadow depth, badge fill,
chevron rotation) is taken from the open-state containers.

**Recommendations carousel.** Five recommendations, three cards per view on
desktop (two at ≤1199px, one at ≤767px), advancing one card at a time. It
auto-rotates every 6s and wraps back to the start; the arrows navigate manually
and reset the timer. Rotation pauses on hover, on keyboard focus inside the
carousel, while the section is off-screen and while the tab is hidden — a mouse
click on an arrow does *not* latch it paused (the focus check uses
`:focus-visible`). Cards outside the current view get `aria-hidden` + `inert` so
they are skipped by Tab and screen readers, and a visually-hidden live region
announces the position. Under `prefers-reduced-motion` auto-rotation is off and
the slide transition is removed; the arrows still work. With JavaScript
disabled the arrows are hidden and the row becomes horizontally scrollable so
all five stay reachable. Card count and interval are data-driven —
`data-carousel-interval` on the wrapper, `--cards-per-view` in CSS.

**Shared carousel texture.** The recommendation cards do not each carry a copy
of `Papertexture.png`. The image is sized to the carousel viewport
(`--tex-w`) and every card offsets it by its own distance from that viewport's
edge (`--tex-x`, set in `paintTexture()`), so the cards read as windows onto one
stationary sheet. `--tex-x` uses `offsetLeft`, which ignores transforms, plus
the translate the track is currently carrying — and `.rec` transitions
`background-position` over the same 520ms as the slide, so the texture holds
perfectly still while the cards travel across it (verified pixel-identical
between slide positions). Without JS each card simply shows the texture scaled
to itself.

**Rolling pills.** The sequence is duplicated in JS and shifted by the measured
pixel width of one set, so the loop is seamless — verified pixel-identical
between phase 0 and phase = duration. Movement is left → right at ~42 px/s,
paused on hover and on keyboard focus within the section, and re-measured on
resize and after webfonts load. Under `prefers-reduced-motion` the animation is
dropped and the row becomes horizontally scrollable. Edge gradient masks are
applied to hide the clip boundary.

**Motion.** Section entrances use `IntersectionObserver`, run once, and are
staggered via `data-reveal-delay`. Everything degrades to fully-visible content
with JavaScript disabled and under `prefers-reduced-motion`.

**Interaction states.** Hover, `:focus-visible`, `:active` and disabled states
are defined for buttons, nav links, footer links, cards, accordion triggers,
form fields and the mobile menu toggle. Transitions are 150–300 ms.

## Known deviations from Figma

1. **Carmela / Hillel CLM** are substituted (see Fonts above). Headline metrics
   will shift slightly until the licensed files are added.
2. **FAQ indicator.** The Figma open-state reference keeps a `+` glyph on every
   item. Per the interaction brief the indicator now changes on open — the
   vertical stroke fades and rotates out, leaving a `−`. Revert by deleting the
   `.faq__item.is-open .faq__icon::after` rule.
3. **Sticky header.** The frame shows the header statically at the top but
   applies a 7px backdrop blur to it, which only reads on a sticky bar — so it
   is implemented as `position: sticky` with an added scrolled state.
4. **Challenge gradient bar** and the **four SVG icons** are not yet exported;
   see Assets above for the stand-ins currently in place.
5. **Recommendations section.** Replaced by a five-item carousel per your
   brief, so it no longer matches the Figma frame's static 1-up + 2-up grid.
   Names, roles and avatars are removed, so cards are quote-only and the
   figcaption divider is gone; card padding drops from 48px to 32px because
   three cards now share the 1184px column. English recommendations carry
   `dir="ltr"` and align left.
6. **Tablet / mobile layouts** are not in the Figma file. They were composed
   from the same tokens: columns stack in reading order, the nav collapses to a
   disclosure menu, type scales with `clamp()`, and the pill marquee narrows its
   gaps and mask.
