import { useCallback, useEffect, useMemo, useState } from "react";
import "./X402Demo.css";

const DEFAULT_API_BASE =
  import.meta.env.VITE_VEIL_API_BASE ||
  "https://api.getviddi.com";

type AnyJson = Record<string, any>;

function cleanBase(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function short(value?: string, n = 14) {
  if (!value) return "—";
  return value.length > n ? `${value.slice(0, n)}…` : value;
}

function asJsonOrText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getJson(base: string, path: string) {
  const res = await fetch(`${cleanBase(base)}${path}`);
  const text = await res.text();

  return {
    ok: res.ok,
    status: res.status,
    body: asJsonOrText(text),
  };
}

function endpointUrl(base: string, path: string) {
  return `${cleanBase(base)}${path}`;
}

export default function X402Demo() {
  const [apiBase, setApiBase] = useState(cleanBase(DEFAULT_API_BASE));
  const [manifest, setManifest] = useState<AnyJson | null>(null);
  const [catalog, setCatalog] = useState<AnyJson | null>(null);
  const [stats, setStats] = useState<AnyJson | null>(null);
  const [proofKey, setProofKey] = useState<AnyJson | null>(null);
  const [output, setOutput] = useState<unknown>("Loading public x402 metadata…");
  const [loading, setLoading] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const routePairs = catalog?.routePairs || [];
  const selectedRoute = routePairs[selectedRouteIndex] || routePairs[0];

  const paidEndpoint = useMemo(() => {
    return (
      manifest?.endpoints?.paidRouteBest?.url ||
      manifest?.x402?.resource ||
      endpointUrl(apiBase, "/x402/routes/best")
    );
  }, [apiBase, manifest]);

  const requestCountry = selectedRoute?.country || "GB";
  const requestProtocol = selectedRoute?.protocol || "v2ray";

  const lastSelected =
    stats?.stats?.lastPaidRouteSuccess?.selected ||
    stats?.stats?.byRoute?.[0]?.lastSelected ||
    selectedRoute?.examples?.[0];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c, s, k] = await Promise.all([
        getJson(apiBase, "/x402/manifest"),
        getJson(apiBase, "/x402/routes/catalog"),
        getJson(apiBase, "/x402/stats"),
        getJson(apiBase, "/x402/proof/public-key"),
      ]);

      setManifest(m.body as AnyJson);
      setCatalog(c.body as AnyJson);
      setStats(s.body as AnyJson);
      setProofKey(k.body as AnyJson);

      setOutput({
        loaded: true,
        apiBase: cleanBase(apiBase),
        manifestStatus: m.status,
        catalogStatus: c.status,
        statsStatus: s.status,
        proofKeyStatus: k.status,
        supportedRoutePairs: (c.body as AnyJson)?.routePairs?.map((r: AnyJson) => ({
          country: r.country,
          protocol: r.protocol,
          count: r.count,
        })),
        proofPublicKey: {
          algorithm: (k.body as AnyJson)?.algorithm,
          publicKeyFingerprint: (k.body as AnyJson)?.publicKeyFingerprint,
        },
      });
    } catch (err) {
      setOutput({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function loadEndpoint(path: string) {
    setLoading(true);
    try {
      setOutput(await getJson(apiBase, path));
    } catch (err) {
      setOutput({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function copyEndpoint() {
    await navigator.clipboard.writeText(paidEndpoint);
    setOutput({ copied: paidEndpoint });
  }

  async function copyCurl() {
    const curl = `curl -i -sS \\
  -H 'Content-Type: application/json' \\
  --data '{"country":"${requestCountry}","protocol":"${requestProtocol}"}' \\
  '${paidEndpoint}'`;
    await navigator.clipboard.writeText(curl);
    setOutput({ copiedCurl: curl });
  }

  async function testUnpaid402() {
    setLoading(true);
    try {
      const res = await fetch(paidEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: requestCountry, protocol: requestProtocol }),
      });

      setOutput({
        test: "valid unpaid request",
        request: { country: requestCountry, protocol: requestProtocol },
        status: res.status,
        expected: 402,
        paymentRequiredHeaderPresent: Boolean(
          res.headers.get("payment-required")
        ),
        body: asJsonOrText(await res.text()),
      });
    } finally {
      setLoading(false);
    }
  }

  async function testInvalid400() {
    setLoading(true);
    try {
      const res = await fetch(paidEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "ZZ", protocol: "bad" }),
      });

      setOutput({
        test: "invalid route request",
        request: { country: "ZZ", protocol: "bad" },
        status: res.status,
        expected: 400,
        paymentRequiredHeaderPresent: Boolean(
          res.headers.get("payment-required")
        ),
        body: asJsonOrText(await res.text()),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="x402-demo">
      <section className="x402-hero">
        <div>
          <p className="x402-eyebrow">Veil Relay x402 POC</p>
          <h1>Paid Sentinel route intelligence for agents.</h1>
          <p>
            A machine client requests a verified Sentinel route. If the request is unpaid,
            the API returns HTTP 402. After Base USDC settlement, the server returns the
            selected route plus a signed proof.
          </p>

          <div className="x402-hero-actions">
            <a href={paidEndpoint} onClick={(event) => event.preventDefault()}>
              Paid endpoint
            </a>
            <a href={endpointUrl(apiBase, "/x402/manifest")} target="_blank">
              Manifest
            </a>
            <a href={endpointUrl(apiBase, "/x402/routes/catalog")} target="_blank">
              Catalog
            </a>
          </div>
        </div>

        <div className={manifest?.ok ? "x402-pill live" : "x402-pill"}>
          <span />
          {manifest?.ok ? "Live" : loading ? "Loading" : "Not loaded"}
        </div>
      </section>

      <section className="x402-flow" aria-label="x402 payment flow">
        <div>
          <span>1</span>
          <strong>Request route</strong>
          <p>Client asks for a country/protocol route.</p>
        </div>
        <div>
          <span>2</span>
          <strong>Receive HTTP 402</strong>
          <p>Unpaid calls return payment requirements.</p>
        </div>
        <div>
          <span>3</span>
          <strong>Pay Base USDC</strong>
          <p>x402 buyer client settles the tiny request fee.</p>
        </div>
        <div>
          <span>4</span>
          <strong>Verify proof</strong>
          <p>Response includes signed route data.</p>
        </div>
      </section>

      <section className="x402-panel">
        <label>Public API base</label>
        <div className="x402-input-row">
          <input
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
          />
          <button onClick={() => void loadAll()} disabled={loading}>
            {loading ? "Loading…" : "Load all"}
          </button>
        </div>

        <div className="x402-buttons">
          <button onClick={() => void loadEndpoint("/x402/manifest")}>
            Manifest
          </button>
          <button onClick={() => void loadEndpoint("/x402/routes/catalog")}>
            Catalog
          </button>
          <button onClick={() => void loadEndpoint("/x402/stats")}>Stats</button>
          <button onClick={() => void loadEndpoint("/x402/proof/public-key")}>
            Proof key
          </button>
          <button onClick={() => void copyEndpoint()}>Copy endpoint</button>
          <button onClick={() => void copyCurl()}>Copy curl</button>
          <button onClick={() => void testUnpaid402()}>Test unpaid 402</button>
          <button onClick={() => void testInvalid400()}>Test invalid 400</button>
        </div>
      </section>

      <section className="x402-grid">
        <div className="x402-card">
          <span>Status</span>
          <strong className="green">{manifest?.ok ? "Live" : "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Price</span>
          <strong>{manifest?.x402?.price || catalog?.price || "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Network</span>
          <strong>{manifest?.x402?.network || catalog?.network || "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Catalog pairs</span>
          <strong>{routePairs.length || "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Route-ready nodes</span>
          <strong>{catalog?.routeReady ?? "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Paid successes</span>
          <strong>{stats?.stats?.paidRouteSuccess ?? "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Unpaid rejections</span>
          <strong>{stats?.stats?.unpaidRouteRejected ?? "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Private fetch</span>
          <strong className="yellow">Disabled</strong>
        </div>
      </section>

      <section className="x402-panel">
        <span className="x402-label">Paid endpoint</span>
        <code>{paidEndpoint}</code>
      </section>

      <section className="x402-two">
        <div className="x402-panel">
          <h2>Supported route catalog</h2>
          {routePairs.length ? (
            <div className="x402-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Count</th>
                    <th>Example node</th>
                    <th>Last verified</th>
                  </tr>
                </thead>
                <tbody>
                  {routePairs.map((route: AnyJson, index: number) => {
                    const example = route.examples?.[0];
                    const active = index === selectedRouteIndex;
                    return (
                      <tr
                        key={`${route.country}-${route.protocol}`}
                        className={active ? "selected" : ""}
                        onClick={() => setSelectedRouteIndex(index)}
                      >
                        <td>{route.country} / {route.protocol}</td>
                        <td>{route.count}</td>
                        <td>{short(example?.nodeAddress, 18)}</td>
                        <td>{example?.lastVerified || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="x402-muted">No route pairs loaded yet.</p>
          )}
        </div>

        <div className="x402-panel">
          <h2>Current signed route proof</h2>
          <dl>
            <div>
              <dt>Route</dt>
              <dd>{requestCountry} / {requestProtocol}</dd>
            </div>
            <div>
              <dt>Node</dt>
              <dd>{lastSelected?.nodeAddress || "—"}</dd>
            </div>
            <div>
              <dt>Exit IP</dt>
              <dd>{lastSelected?.actualExitIp || "—"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{lastSelected?.status || "—"}</dd>
            </div>
            <div>
              <dt>Proof key</dt>
              <dd>
                {proofKey?.algorithm
                  ? `${proofKey.algorithm} / ${short(proofKey.publicKeyFingerprint, 18)}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="x402-two">
        <div className="x402-panel">
          <h2>What is public</h2>
          <ul className="x402-list ok">
            <li>GET /x402/manifest</li>
            <li>GET /x402/routes/catalog</li>
            <li>GET /x402/stats</li>
            <li>GET /x402/proof/public-key</li>
            <li>POST /x402/routes/best after x402 payment</li>
          </ul>
        </div>

        <div className="x402-panel">
          <h2>What is intentionally blocked</h2>
          <ul className="x402-list blocked">
            <li>/v1/private/fetch</li>
            <li>/x402/private/fetch</li>
            <li>/v1/private/session/start</li>
            <li>/v1/private/session/stop</li>
          </ul>
        </div>
      </section>

      <section className="x402-panel">
        <h2>Tester flow</h2>
        <ol>
          <li>Load the route catalog to see supported country/protocol pairs.</li>
          <li>POST without payment to receive a 402 challenge.</li>
          <li>Pay using an x402 buyer client with Base USDC.</li>
          <li>Verify the returned route proof using the public proof key.</li>
        </ol>
      </section>

      <section className="x402-panel">
        <h2>Output</h2>
        <pre>{JSON.stringify(output, null, 2)}</pre>
      </section>
    </main>
  );
}
