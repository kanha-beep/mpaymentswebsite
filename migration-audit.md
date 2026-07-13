# MPay Frontend Migration Audit

## Current State

- The workspace currently contains **no PHP files**.
- The site is already exported as static HTML pages:
  - `/index.html`
  - `/about-us/index.html`
  - `/contact-us/index.html`
  - `/services/index.html`
  - `/company-incorporation-services/index.html`
  - `/european-iban-business-accounts/index.html`
  - `/upi-alternative-payment-solutions/index.html`
  - `/website-technology-services/index.html`
  - `/world-wide-card-processing/index.html`
- The remaining WordPress dependency is on the front end:
  - Elementor-generated HTML structure
  - WordPress/Elementor/Royal Addons/Essential Addons CSS
  - WordPress/Elementor plugin JavaScript
  - asset paths still under `/mirror/wp-content/...`

## What Is Shared Across Pages

- Shared header/navigation structure
- Shared mobile menu pattern
- Shared footer structure
- Shared CTA button patterns
- Shared WPR form markup
- Shared animation/reveal behavior
- Shared image and logo assets

## Dependency Size

- `index.html`: about 800 lines, 39 mirrored CSS includes, 28 mirrored JS includes
- `about-us/index.html`: about 1009 lines, 30 mirrored CSS includes, 27 mirrored JS includes
- `contact-us/index.html`: about 792 lines, 30 mirrored CSS includes, 27 mirrored JS includes
- `services/index.html`: about 2542 lines, large Elementor page with many repeated components
- Service detail pages: each about 1520 to 1535 lines, 30 mirrored CSS includes, 27 mirrored JS includes

## Important Findings

### 1. No backend conversion is required

There is no PHP left in this repo, so the work is not PHP-to-HTML anymore. It is a **WordPress-generated front-end cleanup and rebuild**.

### 2. The visual layout currently depends on generated page CSS

Each page still relies on page-specific Elementor CSS such as:

- `/mirror/wp-content/uploads/elementor/css/post-5...css`
- `/mirror/wp-content/uploads/elementor/css/post-374...css`
- `/mirror/wp-content/uploads/elementor/css/post-377...css`
- `/mirror/wp-content/uploads/elementor/css/post-310...css`
- `/mirror/wp-content/uploads/elementor/css/post-489...css`
- `/mirror/wp-content/uploads/elementor/css/post-491...css`
- `/mirror/wp-content/uploads/elementor/css/post-495...css`
- `/mirror/wp-content/uploads/elementor/css/post-593...css`

These files contain the real spacing, widths, breakpoints, colors, and widget positioning for many sections. If they are removed before the HTML is rewritten, the UI will not stay the same.

### 3. Tailwind-only conversion is a rewrite, not a replacement

To satisfy:

- HTML only
- JS only for behavior
- Tailwind CSS only
- same dimensions
- same UI/layout

we have to:

- replace Elementor/WPR class-driven layout with semantic HTML sections
- recreate every page layout in Tailwind utilities
- rebuild menus, sticky header, animations, forms, and media behavior in vanilla JS
- move or rename WordPress-style asset paths if the repo must contain no `wp-` naming

### 4. Some pages contain invalid exported markup

For example, `/about-us/index.html` contains an embedded `<!DOCTYPE html>` block inside the page body, which should be cleaned during the rewrite.

## Recommended Migration Order

### Phase 1

- Preserve current screenshots/layout as reference
- Extract shared header, footer, nav, buttons, forms, and section primitives
- Build a Tailwind design system matching current spacing, typography, colors, radii, and shadows

### Phase 2

- Rebuild `index.html` in clean semantic HTML + Tailwind + vanilla JS
- Remove all WordPress/Elementor JS from the rebuilt home page

### Phase 3

- Rebuild shared inner-page shell
- Rebuild `about-us`, `contact-us`, and `services`

### Phase 4

- Rebuild each service detail page
- Move remaining media off `/mirror/wp-content/...` if required
- Delete obsolete WordPress-generated CSS/JS references

## What Can Be Reused

- Image/media assets
- Content copy
- Link structure
- Existing `assets/js/site.js` behavior as a reference for:
  - sticky header
  - mobile menus
  - animated text
  - form handling
  - image loading states

## What Still Needs To Be Converted

- All mirrored CSS imports in page heads
- All mirrored plugin/theme JS imports in page footers
- Elementor/WPR/WordPress class-heavy markup
- WordPress-specific body classes and metadata
- `/mirror/wp-content/...` asset naming if the final repo must be fully WordPress-free by structure

## Bottom Line

This repo is already static HTML, but it is **not yet de-WordPressed**.

A true final result matching your requirement means:

- clean semantic HTML pages
- Tailwind-only styling
- vanilla JS functionality
- no Elementor/WordPress runtime dependencies

That is fully possible, but it should be handled as a page-by-page front-end rewrite so the UI stays visually identical.
