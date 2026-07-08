"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function goToDashboard() {
  window.location.assign("/dashboard");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || "Something went wrong. Please try again.");
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSavedLogin, setCheckingSavedLogin] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading || checkingSavedLogin) return;

    setLoading(true);
    setError("");

    try {
      const form = e.currentTarget;
      const email = (form.email as HTMLInputElement).value.trim();
      const password = (form.password as HTMLInputElement).value;

      if (!email || !password) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }

      const { error: loginError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        15000,
        "Login is taking too long. Please check your internet connection and try again."
      );

      if (loginError) {
        setError(loginError.message || "Login failed. Please check your email and password.");
        setLoading(false);
        return;
      }

      goToDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  async function continueToDashboard() {
    if (loading || checkingSavedLogin) return;

    setCheckingSavedLogin(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await withTimeout(
        supabase.auth.getSession(),
        8000,
        "Checking saved login took too long. Please enter your email and password."
      );

      if (sessionError) {
        setError(sessionError.message);
        setCheckingSavedLogin(false);
        return;
      }

      if (session?.user) {
        goToDashboard();
        return;
      }

      setError("No saved login found. Please enter your email and password.");
      setCheckingSavedLogin(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setCheckingSavedLogin(false);
    }
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

          <p className="mt-2 text-sm text-white/55">
            Enter your account email and password to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/12 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />

            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/12 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />

            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || checkingSavedLogin}
              className="w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#050914] transition hover:bg-[#e6c55a] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          
          <div className="mt-3 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>

          <button
            type="button"
            onClick={continueToDashboard}
            disabled={loading || checkingSavedLogin}
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            {checkingSavedLogin ? "Checking saved login..." : "Continue to dashboard"}
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
