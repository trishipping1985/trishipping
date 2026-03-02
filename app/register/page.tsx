"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const name = (form.fullName as HTMLInputElement).value.trim();
    const email = (form.email as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d24] via-[#050914] to-[#02040b]" />
        <div className="absolute left-1/2 top-[-220px] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#d4af37]/12 blur-3xl" />
        <div className="absolute right-[-280px] top-[200px] h-[640px] w-[640px] rounded-full bg-[#1b2559]/45 blur-3xl" />
        <div className="absolute left-[-280px] top-[520px] h-[640px] w-[640px] rounded-full bg-[#0b1440]/45 blur-3xl" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/35 flex items-center justify-center">
            <span className="text-sm font-bold text-[#d4af37]">TRI</span>
          </div>
          <span className="text-sm text-white/70">TRI Shipping</span>
        </Link>

        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-semibold
                     bg-white/5 ring-1 ring-white/15
                     hover:bg-white/10 transition"
        >
          Login
        </Link>
      </header>

      {/* Card */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white/6 ring-1 ring-white/12 p-7 backdrop-blur-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#d4af37]">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Register to manage shipments, photos, labels, and tracking.
          </p>

          {success ? (
            <div className="mt-6 rounded-xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/30 p-4 text-sm text-[#f5dd90]">
              Account created successfully.
              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl px-4 py-3 font-semibold
                             bg-[#d4af37] text-[#050914]
                             hover:bg-[#e6c55a] transition"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-xl px-4 py-3 font-semibold
                             bg-white/5 text-white ring-1 ring-white/12
                             hover:bg-white/10 transition"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-white/70">Full name</label>
                <input
                  name="fullName"
                  required
                  type="text"
                  placeholder="John Doe"
                  className="mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3
                             text-white placeholder:text-white/35
                             focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Email</label>
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3
                             text-white placeholder:text-white/35
                             focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Password</label>
                <input
                  name="password"
                  required
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3
                             text-white placeholder:text-white/35
                             focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
                />
              </div>

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 font-semibold
                           bg-[#d4af37] text-[#050914]
                           hover:bg-[#e6c55a] transition
                           disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>
          )}

          <p className="mt-6 text-xs text-white/45">
            By creating an account, you agree to TRI Shipping terms and secure
            handling policies.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}
