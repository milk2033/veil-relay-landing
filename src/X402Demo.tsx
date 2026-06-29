import { useCallback, useEffect, useMemo, useState } from "react";
import "./X402Demo.css";

const DEFAULT_API_BASE =
  import.meta.env.VITE_VEIL_API_BASE ||
  "https://deposits-coalition-strengthening-runner.trycloudflare.com";

type AnyJson = Record<string, any>;

function cleanBase(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function short(value?: string, n = 12) {
  if (!value) return "—";
  return value.length > n ? `${value.slice(0, n)}…` : value;
}

async function getJson(base: string, path: string) {
  const res = await fetch(`${cleanBase(base)}${path}`);
  const text = await res.text();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    ok: res.ok,
    status: res.status,
    body,
  };
}

export default function X402Demo() {
  const [apiBase, setApiBase] = useState(cleanBase(DEFAULT_API_BASE));
  const [manifest, setManifest] = useState<AnyJson | null>(null);
  const [catalog, setCatalog] = useState<AnyJson | null>(null);
  const [stats, setStats] = useState<AnyJson | null>(null);
  const [proofKey, setProofKey] = useState<AnyJson | null>(null);
  const [output, setOutput] = useState<unknown>("Click Load all.");
  const [loading, setLoading] = useState(false);

  const paidEndpoint = useMemo(() => {
    return (
      manifest?.endpoints?.paidRouteBest?.url ||
      manifest?.x402?.resource ||
      `${cleanBase(apiBase)}/x402/routes/best`
    );
  }, [apiBase, manifest]);

  const firstRoute = catalog?.routePairs?.[0];
  const lastSelected =
    stats?.stats?.lastPaidRouteSuccess?.selected ||
    stats?.stats?.byRoute?.[0]?.lastSelected ||
    firstRoute?.examples?.[0];

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
        manifest: m.body,
        catalog: c.body,
        stats: s.body,
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

  async function testUnpaid402() {
    setLoading(true);
    try {
      const res = await fetch(paidEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "GB", protocol: "v2ray" }),
      });

      setOutput({
        status: res.status,
        expected: 402,
        paymentRequiredHeaderPresent: Boolean(
          res.headers.get("payment-required")
        ),
        body: await res.text(),
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

      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      setOutput({
        status: res.status,
        expected: 400,
        paymentRequiredHeaderPresent: Boolean(
          res.headers.get("payment-required")
        ),
        body,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="x402-demo">
      <section className="x402-hero">
        <div>
          <p className="x402-eyebrow">Veil Relay</p>
          <h1>x402 paid route-answer POC</h1>
          <p>
            Public Sentinel route-intelligence endpoint paid with Base USDC.
            Private fetch remains disabled in Phase 1.
          </p>
        </div>

        <div className={manifest?.ok ? "x402-pill live" : "x402-pill"}>
          <span />
          {manifest?.ok ? "Live" : loading ? "Loading" : "Not loaded"}
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
            Load all
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
          <button onClick={() => void copyEndpoint()}>Copy paid endpoint</button>
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
          <strong>{manifest?.x402?.price || "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Network</span>
          <strong>{manifest?.x402?.network || "—"}</strong>
        </div>
        <div className="x402-card">
          <span>Supported route</span>
          <strong>
            {firstRoute
              ? `${firstRoute.country} / ${firstRoute.protocol}`
              : "—"}
          </strong>
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
          <span>Signed proof</span>
          <strong>
            {proofKey?.algorithm
              ? `${proofKey.algorithm} / ${short(
                  proofKey.publicKeyFingerprint
                )}`
              : "—"}
          </strong>
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
          <h2>Current route proof</h2>
          <dl>
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
              <dt>Route-ready</dt>
              <dd>{catalog?.routeReady ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="x402-panel">
          <h2>Tester flow</h2>
          <ol>
            <li>Load catalog to find supported route pairs.</li>
            <li>POST unpaid to receive a 402 challenge.</li>
            <li>Pay with an x402 buyer client using Base USDC.</li>
            <li>Verify the signed proof using the public key endpoint.</li>
          </ol>
        </div>
      </section>

      <section className="x402-panel">
        <h2>Output</h2>
        <pre>{JSON.stringify(output, null, 2)}</pre>
      </section>
    </main>
  );
}
