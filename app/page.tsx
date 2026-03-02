import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-white bg-[#050914]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d24] via-[#050914] to-black" />
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="absolute right-[-220px] top-[260px] h-[520px] w-[520px] rounded-full bg-[#1b2559]/40 blur-3xl" />
        <div className="absolute left-[-220px] top-[560px] h-[520px] w-[520px] rounded-full bg-[#0b1440]/40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#d4af37]/20 ring-1 ring-[#d4af37]/40 flex items-center justify-center">
            <span className="text-lg font-bold text-[#d4af37]">TRI</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-wide text-white">
              TRI Shipping
            </div>
            <div className="text-xs text-[#d4af37]/70">
              Client Dashboard
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 ring-1 ring-white/15 transition"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition"
          >
            Open Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/15 ring-1 ring-[#d4af37]/30 px-4 py-2 text-xs text-[#d4af37]">
          Premium logistics control center
        </div>

        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
          Precision Shipping.
          <span className="block text-white/70">
            Total visibility. Zero guesswork.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base md:text-lg text-white/70">
          Track packages, view warehouse photos, generate QR labels, and follow
          shipment status — all in one secure dashboard built for international
          forwarding.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition"
          >
            Sign in to your account
          </Link>
          <Link
            href="/track/demo"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold bg-white/5 text-white hover:bg-white/10 ring-1 ring-white/15 transition"
          >
            View tracking demo
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Live package timeline",
              desc: "Every movement logged from warehouse to delivery.",
            },
            {
              title: "Photos & verification",
              desc: "Clear item photos and condition confirmation.",
            },
            {
              title: "QR labels & sorting",
              desc: "Fast identification and consolidation accuracy.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 hover:bg-white/10 transition"
            >
              <div className="text-sm font-semibold text-[#d4af37]">
                {f.title}
              </div>
              <div className="mt-2 text-sm text-white/65">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-white/50">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}
