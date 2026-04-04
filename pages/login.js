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
        <title>DG Eval Access</title>
      </Head>
      <div className={`${displayFont.variable} ${bodyFont.variable} auth-shell`}>
        <div className="auth-card">
          <div className="section-label">Shared access</div>
          <h1>Open the fundraiser eval workspace.</h1>
          <p>
            This is a lightweight shared gate for the hosted internal app. It is intentionally
            simple and keeps the OpenRouter-backed workspace off the public internet.
          </p>
          <form className="field-grid" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
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
        </div>
      </div>
    </>
  );
}
