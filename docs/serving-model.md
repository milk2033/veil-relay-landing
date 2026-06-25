# Veil Relay — Serving model

Veil Relay is a **route-intelligence and verification layer** for AI agents that need
machine-payable internet routes through Sentinel + x402. It is **not** generic proxy
resale, cheap proxies, a consumer VPN, an anonymity product, or a mass proxy pool.

This document describes how the product is served today and how it will grow. The staged
plan keeps each step small and provable before the next one is built.

---

## Stage 0 — Current (live)

- Vercel static landing page (this repo).
- Static `public/routes-status.json` published with the site.
- Snapshot is produced manually / from a generated scanner export (not live yet).
- Early-access capture (form in intake mode + `mailto:` fallback).

The landing page only **reads** published route data. It performs no payments, no SDK
calls, and holds no secrets.

---

## Stage 1 — Route intelligence API

A read API exposing the existing scanner + selector intelligence.

- `GET /v1/routes/status`
  - summary counts (route-ready, per-protocol, SDK-confirmed, blocked)
  - confirmed and blocked routes
  - snapshot `generatedAt`
- `GET /v1/routes/best?country=FR&protocol=v2ray`
  - returns the selected route, expected exit IP, ASN, confidence,
    SDK verification status, live x402 plan status when available, and fallback routes.

Still informational: this stage answers *which route* without moving traffic.

---

## Stage 2 — x402-gated route intelligence

- The user/agent pays via x402 to receive a route answer.
- The API returns the route answer (selected + fallbacks + verification status) **after**
  payment.
- This is still **route intelligence**, not full proxy traffic. We are selling the
  selection + verification answer, not bandwidth.

---

## Stage 3 — Verified route access

- Requires long-running worker/VPS infrastructure.
- Sentinel SDK and session management run **outside the frontend** (VPS/worker only).
- May eventually use a Veil Relay–controlled **curated Sentinel plan**.
- Only include routes that pass scanner checks (route-ready + verified).

---

## Security warning

**Do not store Sentinel credentials, private keys, or SDK session secrets in the
frontend.** The website is a static, public artifact. All wallet/SDK/session material and
any x402 payment signing must live in trusted server-side (VPS/worker) infrastructure,
injected via environment/secret management — never bundled into the client.

---

## Where each piece lives

| Concern                              | Where it runs                    |
| ------------------------------------ | -------------------------------- |
| Landing page + route-status snapshot | Vercel (static)                  |
| Scanner / scoring / export           | VPS / worker                     |
| Route selection (selector)           | VPS / worker (later: API)        |
| Sentinel SDK connect / verify        | VPS / worker only                |
| x402 payment signing                 | VPS / worker only (never client) |
