# Remix of Remix of Remix of Remix of Remix of Subul Coffee Experience

Lovable Prompt — Subul Coffee (سبل كافي) Website

Paste everything below into Lovable as your starting prompt. It's written to avoid the generic "hero + 3 cards + footer" SaaS-template look — every section is tied to Subul's actual brand book.

PROMPT TO PASTE

Build a fully custom, art-directed one-page website for Subul Coffee (سُبـل كافي), a specialty coffee brand in Bir Hadaj. This should NOT look like a template, NOT use generic Bootstrap/SaaS card grids, and NOT use stock hero-with-button layouts. Every section should feel designed specifically for this brand — think boutique hospitality/restaurant site, not startup landing page.

Language & Direction

Primary language: Arabic, full RTL layout (dir="rtl", lang="ar").

Use the brand's actual Arabic wordmark treatment: "سُبـل" in an elegant elongated calligraphic style (the horizontal stroke stretches left like a horizon line, with a small palm tree growing out of the letter). Recreate this feeling in a custom SVG logo (thin extended baseline + palm icon + "ﺱ" diacritic dot), not a generic Arabic web font logo.

Pair Arabic display type with a serif Latin type for "SUBUL COFFEE" (used as a small tracked-out caption under the logo, flanked by thin horizontal dashes: — SUBUL COFFEE —), exactly like the brand book.

Body Arabic copy in a warm, readable serif/humanist Arabic typeface (something like Noto Naskh Arabic or Aref Ruqaa for headings, IBM Plex Sans Arabic for body).

Color System (from brand book — use exactly these)

--sage: #87937C (primary brand green — logo, accents, palm motif)

--cream: #FCF8F2 (primary background, warm off-white)

--espresso: #4D362E (deep brown — dark sections, text on cream)

--olive-dark: #54594D (secondary dark green — dark mode sections, footer)

Use cream as the dominant canvas. Use espresso and olive-dark as alternating "dark act" sections (like a coffee shop that dims the lights). Sage is the accent that ties everything together — never let it become background noise, use it for lines, icons, hover states, and the palm motif.

Signature Motif — the Palm Row

Subul's real packaging (cups, bags) uses a repeating row of small palm-tree silhouettes as a border/divider. Make this the site's recurring visual signature, not just a logo detail:

Build it as a reusable custom SVG component: a horizontal row of simple line-art palm trees.

Use it as an animated scroll-triggered divider between sections — trees "grow" in sequence (staggered scale/opacity, like they're being planted) as the user scrolls past.

Use a vertical version of it (see the story-highlight image in the brand book — palms lining the right edge of a full-height panel) as a fixed decorative rail on the side of at least one section.

On hover over nav items or buttons, a tiny single palm icon can sprout/sway (subtle CSS keyframe sway, 2-3° rotation loop) instead of a generic underline.

Structure & Sections (build these, in this order, each visually distinct — not repeating the same card layout)

1. Opening / Hero

Full-viewport, cream background, centered logo lockup exactly like the brand book's minimal cover slide (logo + "SUBUL COFFEE" caption + palm-row footer, lots of negative space).

On load: logo fades/draws in (stroke-draw animation on the SVG wordmark, like it's being calligraphed live), then the caption and palm row animate in beneath it with a slight delay.

Subtle background texture: extremely faint large-scale palm silhouette pattern (like the cream/palm pattern image in the brand assets), barely visible, very slow parallax drift on mouse move or scroll.

No big "Order Now" button here — let it breathe like a title card. Small scroll-cue (thin animated line moving downward) at the bottom.

2. Brand Story ("سُبل هو أكثر من مجرد مقهى…")

Split layout, but asymmetric — not a boring 50/50 grid. Text block offset, generous margins, first line in large serif Arabic pulled out as a stylized quote (e.g. "أصالة، دفء، وتفاصيل لا تُنسى").

Use the real brand copy (paraphrased/trimmed, not copy-pasted wholesale) about simplicity, warmth, authenticity, and Bir Hadaj as the home base.

Background: deep espresso or olive-dark (first "dark act" moment) with cream text — strong contrast shift from the hero.

A large blurred/soft-focus cup photo (like the motion-blur cup image in the brand book) sits behind the text at low opacity as a textural layer, subtly parallaxing at a different speed than the text on scroll.

3. Menu ("قهوتك")

Reject the standard 3-column pricing-card grid. Instead: a vertical tasting list — each drink is a full-width row that expands on hover/tap (accordion-style) to reveal a one-line tasting note, revealing a small steam/pour animation icon.

Use real items from the brand book café-menu render: إسبريسو (10), أمريكانو (12), لاتيه (14), كابتشينو (14), فلات وايت (15), موكا (16), كولد برو (16). Add 1–2 signature drinks implied by the assets (e.g. an iced palm-branded latte, a pistachio/matcha-style green drink like the one on the tray photo) labeled "من توقيعنا."

A thin animated line (the coffee "pour stream" from the pour-shot photos) can act as a decorative divider between menu categories — an SVG path that animates drawing itself downward as each section scrolls into view.

Prices in a monospace or tabular serif numeral style, right-aligned per RTL convention with dot leaders connecting name → price like a refined restaurant menu.

4. Gallery / Texture Strip

A horizontally scrolling (or scroll-snapped) filmstrip of real brand photography moments recreated: cup nested in green leaves, cup catching hard sunlight on a car hood, iced coffee pour with milk swirl, latte art overhead shot, kraft paper bag in foliage, barista tying an apron.

Use scroll-linked horizontal movement (drag or scroll-jacked) rather than a static image grid — this section should feel like flipping through a mood board, not a <div class="gallery-grid">.

Palm-row divider (thin, sage on cream) caps this section top and bottom.

5. The Space (Bir Hadaj storefront)

Recreate the feeling of the 3D storefront/interior renders: warm stucco tones, rattan chairs, olive awning, arched interior with hanging pendant lights.

Large image or illustrated scene with a subtle Ken Burns slow-zoom on scroll, plus small "hotspot" dots the user can hover (like a map pin) revealing captions: "المقهى," "الكاونتر," "زاوية الجلوس."

Include the address anchor: بئر هداج (Bir Hadaj) and a stylized custom line-art map/pin rather than an embedded generic Google Maps iframe (embed the real map only in the footer/contact section if needed for functionality).

6. Contact / Order

Dark olive/espresso background again (bookend the light hero with a dark closing act).

Phone number 0546700285 as a large tap-to-call element with a subtle glow/pulse on the palm icon beside it.

Social icons minimal, custom-styled (not default icon-library look) — thin-stroke outline icons matching the logo's stroke weight.

Closing line: "Taste the moment" / "طريق المذاق الأصيل" treated as a full-bleed closing statement, large type, centered, with the palm-row pattern fading in behind it very faintly (like the dark green background pattern asset).

7. Footer

Minimal: logo mark, palm row, copyright, phone, one line of Arabic tagline. Dark olive background matching the brand's dark palette slide.

Motion & Interaction Details (be specific in the build — don't default to generic fade-ins)

Use scroll-triggered reveals with staggered, direction-aware timing (elements from the right ease in from the right in RTL, not the default left-to-right assumption most templates ship with).

Custom cursor on desktop: small ring cursor that morphs into a filled sage dot when hovering interactive elements, and briefly shows a tiny palm glyph when hovering the logo.

Section transitions use color-morphing backgrounds (cream → espresso → cream → olive → espresso) as scroll progresses, not hard section cuts — animate the background color itself over the scroll range so transitions feel liquid.

Loading state (if any): a single palm frond drawing itself stroke-by-stroke, not a spinner.

Respect prefers-reduced-motion — provide a calmer fallback (simple opacity fades only).

What to explicitly avoid

No generic "hero image + centered white button" SaaS pattern.

No default icon-library icons (Font Awesome cup/coffee icons) — build simple custom line-art matching the logo's stroke weight, or use the palm motif instead of generic coffee-cup icons everywhere.

No symmetric 3-card "Why Choose Us" grid with icon-title-paragraph repeated three times.

No stock photography — use color/shape treatments (blurred cup silhouettes, gradient washes, line-art palms) to fill space instead, since real photography will be swapped in by the owner later. Leave clearly marked image placeholders sized/cropped to match the compositions described above.

No pure white background — always cream (#FCF8F2) as the "white."

Technical

Responsive, mobile-first, but the desktop experience should feel considered (not just a stretched mobile layout) — use the extra width for the asymmetric story section and horizontal gallery.

Smooth-scroll enabled site-wide.

All copy in Arabic; keep English only for the "SUBUL COFFEE" wordmark caption exactly as the brand book does.

Notes for you before pasting

Swap in your real photos where I've described placeholder compositions — the brand book photography (cup-in-leaves, pour shots, latte art, bag-in-foliage, apron shot) is strong enough to use directly if you export it from the PDF.

If Lovable pushes back toward a more template-y first draft, iterate by referencing specific sections above by name ("make the menu section the tasting-list accordion, not cards") — it responds well to being pointed at one section at a time after the first pass.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e7e99f5-64ff-4080-a25a-80f49c9d34d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
