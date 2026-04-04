import Head from "next/head";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { useState } from "react";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Invalid password.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <>
      <Head>
        <title>Login · Signal Forge</title>
      </Head>
      <div className={`${displayFont.variable} ${bodyFont.variable} auth-shell`}>
        <div className="auth-card">
          <section className="auth-panel">
            <div className="section-label">Private workspace</div>
            <h1>Open Signal Forge.</h1>
            <p>
              A lightweight internal tool for prompt experiments, batch runs, and saved output
              review across fundraiser messaging workflows.
            </p>
            <div className="auth-hero-grid">
              <div className="auth-metric">
                <span>Mode</span>
                <strong>Playground and batches</strong>
              </div>
              <div className="auth-metric">
                <span>Review</span>
                <strong>History and scoring</strong>
              </div>
              <div className="auth-metric">
                <span>Access</span>
                <strong>Password protected</strong>
              </div>
              <div className="auth-metric">
                <span>Models</span>
                <strong>OpenRouter backed</strong>
              </div>
            </div>
          </section>
          <section className="auth-form-panel">
            <div className="section-label">Sign in</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", letterSpacing: "-0.04em" }}>
              Shared team access
            </h2>
            <p style={{ marginTop: 10, marginBottom: 20 }}>
              Enter the workspace password to continue.
            </p>
            <form className="field-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="password">Password</label>
                <input
                  autoFocus
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Shared team password"
                  type="password"
                  value={password}
                />
              </div>
              {error ? <div className="callout error-callout">{error}</div> : null}
              <button className="primary-button" disabled={loading} type="submit">
                {loading ? "Checking…" : "Enter workspace"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
