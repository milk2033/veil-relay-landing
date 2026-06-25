# Veil Relay — Landing Page

A single-page marketing/concept landing page for **Veil Relay**, a route-intelligence and
verification layer for AI agents that need machine-payable internet routes:
*“Verified x402 routes for AI agents.”*

Veil Relay selects, scores, and verifies Sentinel routes before agents use them — each route
checked for x402 availability, expected exit IP, country, ASN, freshness, and recent SDK
performance. It is **not** generic proxy resale or a consumer VPN.

This is a **static concept preview** — no backend, no auth, no wallet/x402 integration,
no database. Just a clean Vite + React + TypeScript page to visualize the idea.

## Run locally

```bash
npm install
npm run dev      # start the dev server (prints a local URL, usually http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # serve the built dist/ locally
```

Requires Node 18+ (works on Node 24).

## Tech

- Vite + React 18 + TypeScript
- Plain CSS (no Tailwind, no UI kit, no animation libraries)
- Zero runtime dependencies beyond React

## Project structure

```
index.html            # document shell + meta/title
vite.config.ts        # Vite + React plugin
tsconfig*.json         # TypeScript config
src/
  main.tsx            # React entry
  App.tsx             # the whole page — all copy & data live here
  App.css             # layout + component styles
  index.css           # theme tokens (colors, fonts) + base styles
```

## Editing the copy

Almost everything you'll want to change is in **`src/App.tsx`**, organized by section
with comment markers:

- **Hero** — the `<h1>` headline, the `.lede` one-liner, the `.hero__sub` paragraph, and the
  terminal card `<Terminal title="veil — best route">`.
- **Problem** — the `#problem` section's `.prose` paragraphs + the `.unknowns` list.
- **How it works** — edit the `STEPS` array (7 items).
- **Proof / status** — edit `CONFIRMED_ROUTES`, `BLOCKED_ROUTE`, and `STATS` (coverage tiles).
- **What you can pay for** — edit the `PRODUCTS` array (4 items).
- **API section** — edit the `API_REQUEST` and `API_RESPONSE` string constants.
- **Early access** — the `#access` section; the form is a placeholder that shows a local
  success message on submit (no network call).
- **Nav links** — edit the `NAV_LINKS` array.

### Changing the look

Colors, fonts, and radii are CSS custom properties at the top of **`src/index.css`**
(`:root`). The single accent color is `--accent` (a muted cyan) — change it once there to
re-theme the whole page. Layout/spacing lives in **`src/App.css`**.

## Notes

- The **proof section** uses two real SDK-confirmed routes (France / V2Ray →
  `31.59.120.143`, United Kingdom / V2Ray → `188.119.155.13`, both strict-verification PASS)
  and one correctly blocked node (Türkiye / WireGuard, recent timeout). The coverage stats
  (14 route-ready: 11 V2Ray / 3 WireGuard) describe the scanner route-ready pool.
- Coverage claims are deliberately modest: **route-ready coverage is not the same as live
  public x402 plan coverage**, and the copy says so.
- The API request/response blocks are **illustrative** of the planned route-intelligence API.
- The email field intentionally has no backend: submitting shows
  *“Not connected yet — placeholder only.”*
- Copy deliberately avoids consumer-VPN / “cheap proxies” / “mass proxy pool” framing and
  leans on infra language: route intelligence, machine-payable x402 access, verified exit
  IP / ASN, scanner-tested selection, SDK feedback scoring.
