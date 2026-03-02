import Link from "next/link";

export default function LoginPage() {
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

        <nav className="flex items-center gap-3">
          <Link
            href="/register"
            className="rounded-lg px-4 py-2 text-sm font-semibold
                       bg-white/5 ring-1 ring-white/15
                       hover:bg-white/10 transition"
          >
            Register
          </Link>
        </nav>
      </header>

      {/* Card */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white/6 ring-1 ring-white/12 p-7 backdrop-blur-sm">
          <h1
            className="text-2xl font-bold tracking-tight
                       bg-gradient-to-r from-[#d4af37] via-[#f5dd90] to-[#d4af37]
                       bg-clip-text text-transparent"
          >
            Sign in
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Access your packages, photos, labels, and tracking updates.
          </p>

          {/* Form (UI only for now) */}
          <form className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
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
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3
                           text-white placeholder:text-white/35
                           focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
              />
            </div>

            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 font-semibold
                         bg-[#d4af37] text-[#050914]
                         hover:bg-[#e6c55a] transition
                         shadow-[0_15px_40px_rgba(212,175,55,0.18)]"
            >
              Login
            </button>

            <div className="flex items-center justify-between text-xs text-white/55">
              <Link href="/forgot-password" className="hover:text-white transition">
                Forgot password?
              </Link>
              <Link href="/register" className="hover:text-white transition">
                Create account
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-white/40">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Alt buttons (UI only) */}
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 font-semibold
                         bg-white/5 text-white ring-1 ring-white/12
                         hover:bg-white/10 transition"
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full rounded-xl px-4 py-3 font-semibold
                         bg-white/5 text-white ring-1 ring-white/12
                         hover:bg-white/10 transition"
            >
              Email me a login link
            </button>
          </div>

          <p className="mt-6 text-xs text-white/45">
            By continuing, you agree to TRI Shipping policies and secure handling
            terms.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}
