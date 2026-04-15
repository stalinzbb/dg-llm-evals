import type { FormEvent } from "react";
import { useState } from "react";

import Head from "next/head";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

interface LoginResponse {
  error?: string;
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as LoginResponse;

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
        <title>Login · Eval AI</title>
      </Head>
      <div className={`${displayFont.variable} ${bodyFont.variable} auth-shell`}>
        <div className="auth-card">
          <section className="auth-panel">
            <div className="section-label">Private workspace</div>
            <h1>Open Eval AI.</h1>
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
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                letterSpacing: "-0.04em",
              }}
            >
              Shared team access
            </h2>
            <p style={{ marginBottom: 20, marginTop: 10 }}>
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
