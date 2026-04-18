"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "go-getem-access";
const STORAGE_VALUE = "authenticated";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setAuthenticated(stored === STORAGE_VALUE);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_APP_PASSWORD;
    if (expected && password === expected) {
      try {
        localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
      } catch {
        /* localStorage unavailable — still unlock for this session */
      }
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  // Render a black screen while checking localStorage, to avoid a flash of
  // either the app or the gate depending on stored state.
  if (authenticated === null) {
    return (
      <div className="fixed inset-0 z-[300]" style={{ background: "#080808" }} />
    );
  }

  if (authenticated) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: "#080808" }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-center"
      >
        <label
          htmlFor="access-code"
          className="text-white"
          style={{
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "0.12em",
            opacity: 0.45,
            textTransform: "uppercase",
          }}
        >
          Enter access code
        </label>

        <div className="input-blob-border-ring mt-5 flex min-h-[52px] w-full min-w-0 items-stretch overflow-hidden rounded-full">
          <div className="flex min-h-[52px] min-w-0 flex-1 items-center rounded-full bg-[#141414] px-5">
            <input
              id="access-code"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-white placeholder-white/40 outline-none"
              style={{ fontWeight: 300, fontSize: 15 }}
            />
          </div>
        </div>

        <div
          className="mt-3 transition-opacity duration-200"
          style={{
            opacity: error ? 1 : 0,
            fontSize: 13,
            fontWeight: 400,
            color: "rgb(248, 113, 113)",
            minHeight: 18,
          }}
          aria-live="polite"
        >
          {error ? "Invalid code" : ""}
        </div>

        <button
          type="submit"
          className="group mt-6 inline-flex items-stretch overflow-hidden rounded-full border border-white"
          aria-label="Enter"
        >
          <span
            className="flex min-h-[48px] items-center justify-center bg-white px-6 py-3 text-center text-black transition-colors group-hover:bg-white/90"
            style={{ fontWeight: 400, fontSize: 15 }}
          >
            Enter
          </span>
          <span
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center border-l border-white bg-black text-white transition-colors group-hover:bg-neutral-900"
            aria-hidden
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </span>
        </button>
      </form>
    </div>
  );
}
