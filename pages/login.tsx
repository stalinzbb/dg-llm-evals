import type { FormEvent } from "react";
import { useState } from "react";

import Head from "next/head";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div
        className={`${displayFont.variable} ${bodyFont.variable} grid min-h-screen place-items-center p-6`}
      >
        <div className="grid w-full max-w-[980px] gap-6 rounded-[var(--radius-xl)] border border-white/65 bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] max-[1120px]:grid-cols-1 max-[720px]:rounded-[18px] max-[720px]:p-4">
          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-6 max-[720px]:rounded-[18px] max-[720px]:p-4">
            <div className="mb-2 text-xs tracking-[0.14em] uppercase text-[color:var(--ink-muted)]">
              Private workspace
            </div>
            <h1>Open Eval AI.</h1>
            <p className="mt-2 max-w-[68ch] text-[color:var(--ink-soft)]">
              A lightweight internal tool for prompt experiments, batch runs, and saved output
              review across fundraiser messaging workflows.
            </p>
            <div className="mt-[22px] grid gap-3 sm:grid-cols-2 max-[720px]:grid-cols-1">
              <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
                <span className="block text-[0.78rem] tracking-[0.08em] uppercase text-[color:var(--ink-muted)]">
                  Mode
                </span>
                <strong className="mt-2 block text-[1.15rem]">Playground and batches</strong>
              </div>
              <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
                <span className="block text-[0.78rem] tracking-[0.08em] uppercase text-[color:var(--ink-muted)]">
                  Review
                </span>
                <strong className="mt-2 block text-[1.15rem]">History and scoring</strong>
              </div>
              <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
                <span className="block text-[0.78rem] tracking-[0.08em] uppercase text-[color:var(--ink-muted)]">
                  Access
                </span>
                <strong className="mt-2 block text-[1.15rem]">Password protected</strong>
              </div>
              <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
                <span className="block text-[0.78rem] tracking-[0.08em] uppercase text-[color:var(--ink-muted)]">
                  Models
                </span>
                <strong className="mt-2 block text-[1.15rem]">OpenRouter backed</strong>
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-6 max-[720px]:rounded-[18px] max-[720px]:p-4">
            <div className="mb-2 text-xs tracking-[0.14em] uppercase text-[color:var(--ink-muted)]">
              Sign in
            </div>
            <h2 className="font-display text-[1.8rem] tracking-[-0.04em]">
              Shared team access
            </h2>
            <p className="mb-5 mt-2.5 text-[color:var(--ink-soft)]">
              Enter the workspace password to continue.
            </p>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label
                  className="text-[0.84rem] font-medium text-[color:var(--ink-soft)]"
                  htmlFor="password"
                >
                  Password
                </label>
                <Input
                  autoFocus
                  className="h-[46px] rounded-[14px] border-[color:var(--line)] bg-[color:var(--surface-muted)] px-3.5"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Shared team password"
                  type="password"
                  value={password}
                />
              </div>
              {error ? (
                <Alert className="rounded-2xl border-[color:color-mix(in_srgb,var(--danger)_24%,var(--line))] bg-[color:var(--danger-soft)] text-[color:var(--danger)]">
                  <AlertDescription className="text-[color:var(--danger)]">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button
                className="h-11 w-full rounded-full border-[color:var(--brand)] bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-strong)]"
                disabled={loading}
                type="submit"
              >
                {loading ? "Checking…" : "Enter workspace"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
