import { useState, type FormEvent, type ReactNode } from "react";
import "./App.css";

/* ────────────────────────────────────────────────────────────────────────
 * Veil Relay — single-page landing.
 * Positioning: route intelligence + verification layer for AI agents that
 * need machine-payable, verified internet routes over Sentinel + x402.
 * All copy lives in this file. Search the section comments below to edit
 * headlines, steps, cards, proof rows, and code samples.
 * ──────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Proof" },
  { href: "#pricing", label: "What you can pay for" },
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

// ── Confirmed + blocked routes (real results) ──
interface ProofRoute {
  country: string;
  protocol: string;
  node: string;
  expectedIp: string;
  actualIp: string | null;
  verification: string;
  status: "sdk_confirmed" | "blocked";
}

const CONFIRMED_ROUTES: ProofRoute[] = [
  {
    country: "France",
    protocol: "V2Ray",
    node: "sentnode1ym4qjy84p0gpvdz0zc2s9q9u5x7lmhdrzwlslz",
    expectedIp: "31.59.120.143",
    actualIp: "31.59.120.143",
    verification: "strict PASS",
    status: "sdk_confirmed",
  },
  {
    country: "United Kingdom",
    protocol: "V2Ray",
    node: "sentnode1przesh8al9anu9m6wd3kp2lz8g4g2lh6qry7ra",
    expectedIp: "188.119.155.13",
    actualIp: "188.119.155.13",
    verification: "strict PASS",
    status: "sdk_confirmed",
  },
];

const BLOCKED_ROUTE: ProofRoute = {
  country: "Türkiye",
  protocol: "WireGuard",
  node: "sentnode19x60rkfph6zxa49and7jv9q02jwgycskgdkew2",
  expectedIp: "—",
  actualIp: null,
  verification: "recent timeout",
  status: "blocked",
};

// ── Coverage snapshot (route-ready pool, not live x402 coverage) ──
const STATS = [
  { num: "14", label: "route-ready nodes" },
  { num: "11", label: "V2Ray" },
  { num: "3", label: "WireGuard" },
  { num: "2", label: "SDK-confirmed routes" },
  { num: "1", label: "correctly blocked" },
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

function ProofCard({ r }: { r: ProofRoute }) {
  const confirmed = r.status === "sdk_confirmed";
  return (
    <article className="card proof">
      <div className="proof__head">
        <span className="proof__route">
          {r.country} <span className="mono">/ {r.protocol}</span>
        </span>
        <Pill kind={confirmed ? "confirmed" : "blocked"}>{r.status}</Pill>
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
        <span className={`kv__v${confirmed ? " kv__v--ok" : ""}`}>{r.actualIp ?? "not connected"}</span>
      </div>
      <div className="kv">
        <span className="kv__k">verification</span>
        <span className={`kv__v${confirmed ? " kv__v--ok" : " kv__v--bad"}`}>{r.verification}</span>
      </div>
    </article>
  );
}

export default function App() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

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
            {CONFIRMED_ROUTES.map((r) => (
              <ProofCard key={r.node} r={r} />
            ))}
          </div>

          <div className="proof-blocked">
            <ProofCard r={BLOCKED_ROUTE} />
            <p className="note">
              Failure handling works too: this Türkiye / WireGuard node hit a recent timeout and is
              correctly blocked from selection until it recovers.
            </p>
          </div>

          <div className="stats">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat__num">{s.num}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </div>
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

        {/* ── 6. Developer / API ── */}
        <section className="section" id="api">
          <div className="section__head">
            <span className="eyebrow">For developers</span>
            <h2>Ask for the best route. Get a verified answer.</h2>
            <p className="section__sub">
              Call <span className="mono">/v1/routes/best</span> with a country and protocol. Get a
              ranked, x402-available, SDK-verified route back — with the expected exit IP, ASN,
              confidence, and a fallback.
            </p>
          </div>
          <div className="grid grid--2">
            <Terminal title="request">
              <span className="t-dim">{API_REQUEST}</span>
            </Terminal>
            <Terminal title="response">{API_RESPONSE}</Terminal>
          </div>
        </section>

        {/* ── 7. Early access ── */}
        <section className="section access" id="access">
          <div className="card access__card">
            <span className="eyebrow">Early access</span>
            <h2>Looking for technical testers.</h2>
            <p className="section__sub">
              We're onboarding teams whose agents need verified, country-specific routes over
              x402. Drop an email and we'll reach out as slots open.
            </p>
            {submitted ? (
              <p className="access__success" role="status">
                Not connected yet — placeholder only. (No backend wired up.)
              </p>
            ) : (
              <form className="access__form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="you@company.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button className="btn btn--primary" type="submit">
                  Request early access
                </button>
              </form>
            )}
            <p className="access__fine">
              No anonymity claims, no mass proxy pool. Just selected, x402-available, SDK-verified
              Sentinel routes — with the proof attached.
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
