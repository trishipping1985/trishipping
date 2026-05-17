"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function goToDashboard() {
  window.location.replace("/dashboard");
}

export default function LoginPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          goToDashboard();
          return;
        }

        setCheckingSession(false);
      } catch {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setCheckingSession(false);
      }
    }, 2500);

    checkExistingSession();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const existingSession = await supabase.auth.getSession();

    if (existingSession.data.session?.user) {
      goToDashboard();
      return;
    }

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    goToDashboard();
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050914] px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/6 px-6 py-5 text-center shadow-2xl">
          <div className="text-sm font-bold text-[#d4af37]">
            Checking your login...
          </div>
          <div className="mt-2 text-xs text-white/50">Please wait.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/35">
            <span className="text-sm font-bold text-[#d4af37]">TRI</span>
          </div>

          <span className="text-sm text-white/70">TRI Shipping</span>
        </Link>

        <Link
          href="/register"
          className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold ring-1 ring-white/15 transition hover:bg-white/10"
        >
          Register
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white/6 p-7 ring-1 ring-white/12 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-[#d4af37]">Login</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/12 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />

            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/12 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />

            {error ? <div className="text-sm text-red-300">{error}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#050914] transition hover:bg-[#e6c55a] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={goToDashboard}
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Continue to dashboard
          </button>

          <p className="mt-6 text-xs text-white/50">
            No account?{" "}
            <Link href="/register" className="text-[#d4af37] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}