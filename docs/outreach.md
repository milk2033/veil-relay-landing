# Veil Relay — Outreach notes

Direct, non-hype outreach for early users. The goal is to find people who already feel the
problem: choosing and **verifying** paid internet routes programmatically.

---

## Likely early users

- AI agent developers (agents that need region-specific or specific-network access)
- Browser automation builders (Playwright/Puppeteer, scraping, testing)
- Geo-testing / monitoring tools (per-country checks, uptime, localization QA)
- DePIN / x402 developers (already in the machine-payment ecosystem)
- Machine-payable API builders (services that pay-per-call for infrastructure)

---

## Positioning

**Lead with:**

> "Are you building agents that need to choose and verify paid internet routes
> programmatically?"

**Avoid:**

> "Do you want proxies?"

We sell route intelligence and verification — which route works, where it actually exits,
and proof it matched expectation — not proxies, anonymity, or bandwidth.

---

## Message templates

### 1. Short DM

> Hey — building Veil Relay: a route-intelligence layer for agents that need verified,
> machine-payable internet routes (Sentinel + x402). It picks the best route by
> country/protocol and verifies the real exit IP before your agent uses it. Are you
> hitting "which paid route actually works?" problems? Happy to share confirmed routes.

### 2. Slightly longer email

> Subject: Verified paid routes for your agents (not proxies)
>
> Hi {name},
>
> I'm building Veil Relay — a route-intelligence and verification layer for AI agents that
> need machine-payable internet routes through Sentinel + x402.
>
> The gap we close: x402 lets an agent *pay* for access, but it doesn't tell the agent
> which node actually works, whether it's in the live plan, what exit IP/ASN to expect, or
> whether the final route matched. Veil Relay selects, scores, and verifies the route
> first, then hands back a working exit with proof.
>
> We've confirmed real routes end-to-end (e.g. France and UK V2Ray, both matching the
> predicted exit IP exactly) and we correctly block nodes that recently failed.
>
> If you're building agents, automation, or geo-testing that needs verified routes, I'd
> love to hear your target countries, protocol needs, and expected volume. Worth a quick
> look?
>
> — {you}

### 3. Technical community post

> **Route intelligence for agents on x402 (Sentinel)**
>
> x402 makes paying for internet access machine-native, but payment alone doesn't answer:
> which node works, is it in the live x402 plan right now, what exit IP/ASN to expect, and
> did the route actually match?
>
> Veil Relay is the selection + verification layer: scan Sentinel nodes → score route
> readiness → intersect with the live x402 plan → select the best route → connect via the
> SDK → verify the exit IP → feed results back into scoring.
>
> Current proof: 2 SDK-confirmed routes (FR/V2Ray → 31.59.120.143, GB/V2Ray →
> 188.119.155.13, both strict-verification PASS) and 1 correctly blocked node after a
> recent timeout. Coverage is early and route-ready ≠ live x402 plan coverage; we filter
> for that at selection time.
>
> If you build agents/automation that need verified paid routes, I'm looking for early
> testers — tell me your target countries, protocol needs, and expected volume.

---

## Notes

- Keep claims accurate: name only confirmed routes; don't imply broad global coverage.
- Don't promise full proxy/traffic access yet — current product is route intelligence.
- Never share wallet mnemonics, private keys, or SDK session secrets in outreach.
