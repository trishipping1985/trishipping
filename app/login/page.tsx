"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <header className="mx-auto max-w-6xl px-6 pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/35 flex items-center justify-center">
            <span className="text-sm font-bold text-[#d4af37]">TRI</span>
          </div>
          <span className="text-sm text-white/70">TRI Shipping</span>
        </Link>

        <Link
          href="/register"
          className="rounded-lg px-4 py-2 text-sm font-semibold bg-white/5 ring-1 ring-white/15 hover:bg-white/10 transition"
        >
          Register
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white/6 ring-1 ring-white/12 p-7 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-[#d4af37]">Login</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />

            {error ? <div className="text-sm text-red-300">{error}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 font-semibold bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

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
