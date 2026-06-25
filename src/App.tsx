import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import "./App.css";

/* ────────────────────────────────────────────────────────────────────────
 * Veil Relay — single-page landing.
 * Positioning: route intelligence + verification layer for AI agents that
 * need machine-payable, verified internet routes over Sentinel + x402.
 * Proof data is loaded from /routes-status.json with a hardcoded fallback.
 * ──────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Proof" },
  { href: "#pricing", label: "What you can pay for" },
  { href: "#serving", label: "Serving model" },
  { href: "#api", label: "API" },
  { href: "#access", label: "Early access" },
];

// ── How it works (7 steps) ──
const STEPS = [
  {
    n: "01",
    title: "Scan Sentinel nodes",
    body: "Continuously probe live Sentinel nodes across WireGuard and V2Ray for reachability, handshake success, and throughput.",
  },
  {
    n: "02",
    title: "Score route readiness",
    body: "Rank each node on freshness, protocol support, country accuracy, speed, and recent connection history.",
  },
  {
    n: "03",
    title: "Intersect with live x402",
    body: "Keep only nodes that are actually inside the live public x402 plan right now — not just scanner-known.",
  },
  {
    n: "04",
    title: "Select the best route",
    body: "Choose the top candidate for the requested country and protocol, with a ranked fallback list behind it.",
  },
  {
    n: "05",
    title: "Connect via the SDK",
    body: "Establish the route through the Sentinel SDK using x402-paid access — no accounts, no card on file.",
  },
  {
    n: "06",
    title: "Verify the exit IP",
    body: "Confirm the live exit IP, country, and ASN match what was expected before the route is handed back.",
  },
  {
    n: "07",
    title: "Feed results back",
    body: "Push SDK success/failure and verification outcomes back into scoring, so route selection improves over time.",
  },
];

// ── Serving model stages ──
const SERVING_STAGES = [
  { when: "Today", body: "Public proof page + static route-status snapshot." },
  {
    when: "Next",
    body: "Route intelligence API returning ranked routes, expected exit IP, ASN, confidence, SDK verification status, and fallback routes.",
  },
  { when: "Then", body: "x402-gated route intelligence — pay per route answer." },
  {
    when: "Later",
    body: "Curated x402 route access through a Veil Relay–controlled Sentinel plan.",
  },
];

// ── What customers can pay for (4) ──
const PRODUCTS = [
  {
    title: "Route intelligence API",
    body: "Best route by country and protocol, route health, expected exit IP and ASN, a confidence score, SDK verification status, and a fallback route.",
    tag: "api",
  },
  {
    title: "Verified route reports",
    body: "Per-route proof: expected vs. actual exit IP, country, ASN, the strict verification result, and connect timing.",
    tag: "verification",
  },
  {
    title: "Fallback route selection",
    body: "Ranked alternates so a single failing or out-of-plan node doesn't break the request — the next-best route is already chosen.",
    tag: "resilience",
  },
  {
    title: "Curated x402 endpoint",
    body: "A Veil Relay–controlled Sentinel plan that exposes only scanner-verified nodes through a single x402 endpoint. Deferred until public x402 + scanner-selected proof worked — that proof now exists.",
    tag: "roadmap",
  },
];

// ── Code samples (API section) ──
const API_REQUEST = `POST /v1/routes/best
Content-Type: application/json

{
  "country": "FR",
  "protocol": "v2ray"
}`;

const API_RESPONSE = `{
  "selected": {
    "nodeAddress": "sentnode1ym4…lslz",
    "country": "FR",
    "protocol": "v2ray",
    "expectedExitIp": "31.59.120.143",
    "expectedAsn": "AS56971",
    "confidence": 0.96,
    "sdkVerification": "sdk_confirmed",
    "inLiveX402Plan": true
  },
  "fallback": [
    { "nodeAddress": "sentnode1rc9…mwsf", "confidence": 0.91 }
  ]
}`;

// TODO: replace with a real contact address before launch (placeholder only).
const CONTACT_EMAIL = "early-access@veil-relay.dev";
const CONTACT_SUBJECT = "Veil Relay early access";

// Optional capture endpoint (Formspree / Tally / custom). When unset, the form
// runs in "intake-only" mode and points people at the mailto fallback below.
const FORM_ENDPOINT = import.meta.env.VITE_EARLY_ACCESS_FORM_ENDPOINT;

/* ── Route-status JSON (loaded from /routes-status.json) ─────────────────── */

interface RouteEntry {
  country: string;
  countryCode: string;
  protocol: string;
  nodeAddress: string;
  expectedExitIp: string | null;
  actualExitIp: string | null;
  asn: string | null;
  lastVerified: string | null;
  verification: string;
  status: string;
}

interface RoutesSummary {
  routeReady: number;
  v2ray: number;
  wireguard: number;
  sdkConfirmed: number;
  blocked: number;
}

interface RoutesStatus {
  schemaVersion: number;
  generatedAt: string;
  source: string;
  note: string;
  summary: RoutesSummary;
  confirmedRoutes: RouteEntry[];
  blockedRoutes: RouteEntry[];
}

// Normalized shape the UI renders.
interface DisplayRoute {
  country: string;
  protocol: string;
  node: string;
  expectedIp: string;
  actualIp: string | null;
  asn: string;
  lastVerified: string;
  verification: string;
  statusLabel: string;
  confirmed: boolean;
}

// ── Hardcoded fallback (used if /routes-status.json fails to load) ──
const FALLBACK_CONFIRMED: DisplayRoute[] = [
  {
    country: "France",
    protocol: "V2Ray",
    node: "sentnode1ym4qjy84p0gpvdz0zc2s9q9u5x7lmhdrzwlslz",
    expectedIp: "31.59.120.143",
    actualIp: "31.59.120.143",
    asn: "AS56971 AS56971 Cloud",
    lastVerified: "2026-06-25 04:43 UTC",
    verification: "strict PASS",
    statusLabel: "sdk_confirmed",
    confirmed: true,
  },
  {
    country: "United Kingdom",
    protocol: "V2Ray",
    node: "sentnode1przesh8al9anu9m6wd3kp2lz8g4g2lh6qry7ra",
    expectedIp: "188.119.155.13",
    actualIp: "188.119.155.13",
    asn: "AS201323 Host Media Ltd",
    lastVerified: "2026-06-25 05:02 UTC",
    verification: "strict PASS",
    statusLabel: "sdk_confirmed",
    confirmed: true,
  },
];

const FALLBACK_BLOCKED: DisplayRoute[] = [
  {
    country: "Türkiye",
    protocol: "WireGuard",
    node: "sentnode19x60rkfph6zxa49and7jv9q02jwgycskgdkew2",
    expectedIp: "—",
    actualIp: null,
    asn: "—",
    lastVerified: "—",
    verification: "recent timeout",
    statusLabel: "recent_timeout_failure",
    confirmed: false,
  },
];

const FALLBACK_SUMMARY: RoutesSummary = {
  routeReady: 14,
  v2ray: 11,
  wireguard: 3,
  sdkConfirmed: 2,
  blocked: 1,
};

function protoLabel(p: string): string {
  const k = p.toLowerCase();
  if (k === "v2ray") return "V2Ray";
  if (k === "wireguard") return "WireGuard";
  return p;
}

function toDisplay(e: RouteEntry): DisplayRoute {
  return {
    country: e.country,
    protocol: protoLabel(e.protocol),
    node: e.nodeAddress,
    expectedIp: e.expectedExitIp ?? "—",
    actualIp: e.actualExitIp,
    asn: e.asn ?? "—",
    lastVerified: e.lastVerified ?? "—",
    verification: e.verification,
    statusLabel: e.status,
    confirmed: e.status === "sdk_confirmed",
  };
}

// "2026-06-25T05:10:00Z" → "2026-06-25 05:10 UTC"
function fmtGenerated(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

function statTiles(s: RoutesSummary) {
  return [
    { num: String(s.routeReady), label: "route-ready nodes" },
    { num: String(s.v2ray), label: "V2Ray" },
    { num: String(s.wireguard), label: "WireGuard" },
    { num: String(s.sdkConfirmed), label: "SDK-confirmed routes" },
    { num: String(s.blocked), label: "correctly blocked" },
  ];
}

function Pill({ kind, children }: { kind: string; children: ReactNode }) {
  return <span className={`pill pill--${kind}`}>{children}</span>;
}

function Terminal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="terminal" role="img" aria-label={title}>
      <div className="terminal__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__title">{title}</span>
      </div>
      <pre className="terminal__body">{children}</pre>
    </div>
  );
}

function short(node: string) {
  return node.length > 22 ? `${node.slice(0, 12)}…${node.slice(-6)}` : node;
}

function ProofCard({ r }: { r: DisplayRoute }) {
  return (
    <article className="card proof">
      <div className="proof__head">
        <span className="proof__route">
          {r.country} <span className="mono">/ {r.protocol}</span>
        </span>
        <Pill kind={r.confirmed ? "confirmed" : "blocked"}>{r.statusLabel}</Pill>
      </div>
      <div className="kv">
        <span className="kv__k">node</span>
        <span className="kv__v" title={r.node}>
          {short(r.node)}
        </span>
      </div>
      <div className="kv">
        <span className="kv__k">expected IP</span>
        <span className="kv__v">{r.expectedIp}</span>
      </div>
      <div className="kv">
        <span className="kv__k">actual IP</span>
        <span className={`kv__v${r.confirmed ? " kv__v--ok" : ""}`}>{r.actualIp ?? "not connected"}</span>
      </div>
      <div className="kv">
        <span className="kv__k">ASN</span>
        <span className="kv__v">{r.asn}</span>
      </div>
      <div className="kv">
        <span className="kv__k">last verified</span>
        <span className="kv__v">{r.lastVerified}</span>
      </div>
      <div className="kv">
        <span className="kv__k">verification</span>
        <span className={`kv__v${r.confirmed ? " kv__v--ok" : " kv__v--bad"}`}>{r.verification}</span>
      </div>
    </article>
  );
}

interface EarlyAccessForm {
  email: string;
  useCase: string;
  targetCountries: string;
  protocolNeeds: string;
  expectedVolume: string;
}

const EMPTY_FORM: EarlyAccessForm = {
  email: "",
  useCase: "",
  targetCountries: "",
  protocolNeeds: "",
  expectedVolume: "",
};

type FormPhase = "idle" | "submitting" | "sent" | "error" | "no-endpoint";

export default function App() {
  // ── Route-status data ──
  const [status, setStatus] = useState<RoutesStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/routes-status.json", { cache: "no-cache" })
      .then((res) => (res.ok ? (res.json() as Promise<RoutesStatus>) : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmedRoutes = status ? status.confirmedRoutes.map(toDisplay) : FALLBACK_CONFIRMED;
  const blockedRoutes = status ? status.blockedRoutes.map(toDisplay) : FALLBACK_BLOCKED;
  const summary = status?.summary ?? FALLBACK_SUMMARY;
  const generatedAt = status?.generatedAt ?? null;
  const firstBlocked = blockedRoutes[0];

  // ── Early-access form ──
  const [form, setForm] = useState<EarlyAccessForm>(EMPTY_FORM);
  const [phase, setPhase] = useState<FormPhase>("idle");

  function update<K extends keyof EarlyAccessForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mailtoBody = [
    "Hi Veil Relay team,",
    "",
    "I'd like early access. Here's my use case:",
    `- What I'm building: ${form.useCase || ""}`,
    `- Target countries: ${form.targetCountries || ""}`,
    `- Protocol needs (WireGuard / V2Ray): ${form.protocolNeeds || ""}`,
    `- Expected request volume: ${form.expectedVolume || ""}`,
    form.email ? `\nReply to: ${form.email}` : "",
  ].join("\n");
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    CONTACT_SUBJECT
  )}&body=${encodeURIComponent(mailtoBody)}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // No capture endpoint configured → intake-only mode (no fake "stored" claim).
    if (!FORM_ENDPOINT) {
      setPhase("no-endpoint");
      return;
    }

    setPhase("submitting");
    try {
      // To wire a real backend: set VITE_EARLY_ACCESS_FORM_ENDPOINT to a
      // Formspree/Tally/custom URL that accepts a JSON POST.
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPhase("sent");
    } catch {
      setPhase("error");
    }
  }

  const showForm = phase === "idle" || phase === "submitting" || phase === "error";

  return (
    <div className="page">
      {/* ── Top nav ── */}
      <header className="nav">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true" />
          Veil Relay
        </a>
        <nav className="nav__links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn btn--ghost nav__cta" href="#access">
          Request early access
        </a>
      </header>

      <main id="top">
        {/* ── 1. Hero ── */}
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">Route intelligence for AI agents</span>
            <h1>Verified x402 routes for AI agents.</h1>
            <p className="lede">
              Machine-payable internet routes, selected and verified before use.
            </p>
            <p className="hero__sub">
              Veil Relay selects, scores, and verifies Sentinel routes before agents use them —
              each one checked for x402 availability, expected exit IP, country, ASN, freshness,
              and recent SDK performance.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#how">
                How it works
              </a>
              <a className="btn btn--ghost" href="#proof">
                See confirmed routes
              </a>
            </div>
            <div className="hero__meta">
              <span>route intelligence</span>
              <span>x402</span>
              <span>verified exit IP / ASN</span>
              <span>SDK feedback</span>
            </div>
            <p className="hero__proof">
              <span className="hero__proof-dot" aria-hidden="true" />
              First confirmed routes: France and UK V2Ray, both matching predicted exit IPs
              exactly.
            </p>
          </div>

          <Terminal title="veil — best route">
{`$ veil route best --country FR --protocol v2ray

`}
            <span className="t-dim">selected:</span> sentnode1ym4…lslz{"\n"}
            <span className="t-dim">expected exit:</span> 31.59.120.143{"\n"}
            <span className="t-dim">verified exit:</span> 31.59.120.143{"\n"}
            <span className="t-dim">country:</span> FR (v2ray){"\n"}
            <span className="t-dim">strict verify:</span> <span className="t-ok">PASS</span>{"\n"}
            <span className="t-dim">status:</span> <span className="t-ok">sdk_confirmed</span>
          </Terminal>
        </section>

        {/* ── 2. Problem ── */}
        <section className="section" id="problem">
          <div className="section__head">
            <span className="eyebrow">The problem</span>
            <h2>x402 lets agents pay. It doesn't tell them which route works.</h2>
          </div>
          <div className="prose">
            <p>
              AI agents and automated systems sometimes need to reach the internet from a
              specific jurisdiction or network profile. x402 makes the payment machine-native —
              but payment alone doesn't answer the questions that actually decide whether a route
              is usable.
            </p>
            <ul className="unknowns">
              <li>which node actually works</li>
              <li>whether it's fresh and fast enough</li>
              <li>whether it's in the live x402 plan right now</li>
              <li>what exit IP and ASN to expect</li>
              <li>whether the final route really matched expectation</li>
            </ul>
            <p>
              Veil Relay is the <strong>route-selection and verification layer</strong> that sits
              between an agent and Sentinel — so automation gets a working, verified exit instead
              of a node to gamble on.
            </p>
          </div>
        </section>

        {/* ── 3. How it works ── */}
        <section className="section" id="how">
          <div className="section__head">
            <span className="eyebrow">How it works</span>
            <h2>From raw nodes to a verified, machine-payable route.</h2>
          </div>
          <ol className="steps steps--7">
            {STEPS.map((s) => (
              <li className="step card" key={s.n}>
                <span className="step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 4. Proof / status ── */}
        <section className="section" id="proof">
          <div className="section__head">
            <span className="eyebrow">Proof</span>
            <h2>Routes confirmed end-to-end through the SDK.</h2>
            <p className="section__sub">
              Real selections: chosen from scanner route-ready data, intersected with the live
              public x402 plan, connected via the Sentinel SDK, then verified against the expected
              exit IP.
            </p>
          </div>

          <div className="grid grid--2">
            {confirmedRoutes.map((r) => (
              <ProofCard key={r.node} r={r} />
            ))}
          </div>

          {firstBlocked && (
            <div className="proof-blocked">
              <ProofCard r={firstBlocked} />
              <p className="note">
                Failure handling works too: nodes with recent timeouts or failures are correctly
                blocked from selection until they recover — bad routes are withheld, not served.
              </p>
            </div>
          )}

          <div className="stats">
            {statTiles(summary).map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat__num">{s.num}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="data-source">
            Data source: static scanner snapshot.
            {generatedAt ? ` Generated ${fmtGenerated(generatedAt)}.` : ""}
            {loadFailed ? " Live snapshot unavailable — showing last-known values." : ""}
          </p>
          <p className="note">
            Coverage is early and intentionally narrow. Route-ready coverage does not equal live
            public x402 plan coverage — a scanner route-ready node may not currently be inside the
            live x402 plan, and we filter for that at selection time.
          </p>
        </section>

        {/* ── 5. What you can pay for ── */}
        <section className="section" id="pricing">
          <div className="section__head">
            <span className="eyebrow">What customers can pay for</span>
            <h2>Sold as route intelligence, not proxies.</h2>
            <p className="section__sub">
              This is not generic proxy resale or a consumer VPN. It's an access and verification
              layer for programmatic callers — agents, jobs, and infrastructure.
            </p>
          </div>
          <div className="grid grid--2">
            {PRODUCTS.map((p) => (
              <article className="card product" key={p.title}>
                <span className="tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── 6. Serving model ── */}
        <section className="section" id="serving">
          <div className="section__head">
            <span className="eyebrow">Serving model</span>
            <h2>How users will access Veil Relay.</h2>
            <p className="section__sub">
              This page is proof, not the product. The first product is route intelligence; full
              route access comes later.
            </p>
          </div>
          <ol className="stages-list">
            {SERVING_STAGES.map((s) => (
              <li className="stage-row card" key={s.when}>
                <span className="stage-when">{s.when}</span>
                <span className="stage-body">{s.body}</span>
              </li>
            ))}
          </ol>
          <p className="note">
            The Sentinel SDK and proxy/session handling run in long-running VPS/worker
            infrastructure — never in this frontend. The website only reads published route data.
          </p>
        </section>

        {/* ── 7. Developer / API ── */}
        <section className="section" id="api">
          <div className="section__head">
            <span className="eyebrow">For developers</span>
            <h2>Ask for the best route. Get a ranked answer.</h2>
            <p className="section__sub">
              Call <span className="mono">/v1/routes/best</span> with a country and protocol. Get a
              ranked, x402-available route with the expected exit IP, ASN, confidence, recent SDK
              verification status when available, and a fallback.
            </p>
            <p className="caveat">
              Planned API shape — route-intelligence endpoint under development. Field names may
              change.
            </p>
          </div>
          <div className="grid grid--2">
            <Terminal title="request">
              <span className="t-dim">{API_REQUEST}</span>
            </Terminal>
            <Terminal title="response">{API_RESPONSE}</Terminal>
          </div>
        </section>

        {/* ── 8. Early access ── */}
        <section className="section access" id="access">
          <div className="card access__card">
            <span className="eyebrow">Early access</span>
            <h2>Request early access.</h2>
            <p className="section__sub">
              Tell us what you're building, your target countries, protocol needs, and expected
              request volume.
            </p>

            {phase === "sent" ? (
              <p className="access__success" role="status">
                Thanks — we've received your early-access request and will be in touch.
              </p>
            ) : phase === "no-endpoint" ? (
              <p className="access__success" role="status">
                Early-access capture isn't connected yet. Send your use case through the contact
                link below — <a href={mailtoHref}>{CONTACT_EMAIL}</a>.
              </p>
            ) : null}

            {showForm && (
              <form className="access__form access__form--full" onSubmit={handleSubmit}>
                <div className="field-grid">
                  <input
                    type="email"
                    required
                    placeholder="you@company.dev"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-label="Email address"
                  />
                  <input
                    type="text"
                    placeholder="Target countries (e.g. FR, GB)"
                    value={form.targetCountries}
                    onChange={(e) => update("targetCountries", e.target.value)}
                    aria-label="Target countries"
                  />
                  <input
                    type="text"
                    placeholder="Protocol needs (WireGuard / V2Ray)"
                    value={form.protocolNeeds}
                    onChange={(e) => update("protocolNeeds", e.target.value)}
                    aria-label="Protocol needs"
                  />
                  <input
                    type="text"
                    placeholder="Expected request volume"
                    value={form.expectedVolume}
                    onChange={(e) => update("expectedVolume", e.target.value)}
                    aria-label="Expected request volume"
                  />
                </div>
                <textarea
                  placeholder="What are you building? (agents, automation, geo-testing…)"
                  value={form.useCase}
                  onChange={(e) => update("useCase", e.target.value)}
                  aria-label="What are you building?"
                  rows={3}
                />
                <button className="btn btn--primary" type="submit" disabled={phase === "submitting"}>
                  {phase === "submitting" ? "Sending…" : "Request early access"}
                </button>
                {phase === "error" && (
                  <p className="access__error" role="status">
                    Couldn't submit just now. Please email{" "}
                    <a href={mailtoHref}>{CONTACT_EMAIL}</a> instead.
                  </p>
                )}
              </form>
            )}

            <p className="access__fine">
              {FORM_ENDPOINT
                ? "We only use this to evaluate early-access fit. "
                : "Capture endpoint not configured yet — the email link is the reliable path. "}
              Prefer email? Reach us directly at <a href={mailtoHref}>{CONTACT_EMAIL}</a>. No
              anonymity claims, no mass proxy pool — just selected, x402-available, SDK-verified
              Sentinel routes with the proof attached.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          Veil Relay
        </div>
        <p className="footer__note">
          Concept preview. Built on Sentinel dVPN and the x402 protocol. Early-stage; coverage is
          limited.
        </p>
      </footer>
    </div>
  );
}
