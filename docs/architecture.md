# Current architecture

Next.js App Router serves the landing page and prerenders one detail page per sample resource. The catalogue renders on the server with a GET form, so applying filters and opening a bookmarked search both work without JavaScript.

The sample inventory and filtering live in `src/lib/catalogue.ts`. Route components pass resource records to shared presentation components in `src/components`. The sample records model cross-department discovery and approval labels without requiring an authenticated session.

The development and production scripts use Next.js's Webpack option because the Turbopack PostCSS worker exits during startup on the development machine. The lint configuration uses ESLint 9 to match the peer requirements of Next.js's accessibility, React, and import plugins.

## Colour contrast

The CSS tokens follow the system light or dark preference. The ratios below use WCAG relative luminance and are rounded to two decimal places.

| Pair                           | Contrast |
| ------------------------------ | -------: |
| Primary button text on orange  |   4.61:1 |
| Light body text on paper       |  14.63:1 |
| Light secondary text on paper  |   7.14:1 |
| Light accent text on paper     |   5.90:1 |
| Light focus ring on surface    |   6.39:1 |
| Light field border on paper    |   3.44:1 |
| Dark secondary text on surface |   9.02:1 |
| Dark focus ring on surface     |   7.12:1 |
| Dark field border on surface   |   5.21:1 |
