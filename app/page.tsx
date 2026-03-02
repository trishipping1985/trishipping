import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050914] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d24] via-[#050914] to-[#02040b]" />
        <div className="absolute left-1/2 top-[-220px] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#d4af37]/12 blur-3xl" />
        <div className="absolute right-[-280px] top-[200px] h-[640px] w-[640px] rounded-full bg-[#1b2559]/45 blur-3xl" />
        <div className="absolute left-[-280px] top-[520px] h-[640px] w-[640px] rounded-full bg-[#0b1440]/45 blur-3xl" />
      </div>

      {/* Top (optional, subtle) */}
      <header className="mx-auto max-w-6xl px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/35 flex items-center justify-center">
            <span className="text-sm font-bold text-[#d4af37]">TRI</span>
          </div>
          <div className="text-sm text-white/70">Client Dashboard</div>
        </div>
      </header>

      {/* Centered hero like your screenshot */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          TRI Shipping
        </h1>

        <p className="mt-4 text-white/70 text-base md:text-lg">
          Premium international forwarding &amp; handling
        </p>

        <div className="mt-8">
          <Link
            href="/track"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold
                       bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition
                       shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
          >
            Track Your Shipment
          </Link>
        </div>

        {/* Feature cards row */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            title="Handled With Care"
            desc="Luxury-level handling standards for every shipment."
          />
          <FeatureCard
            title="Global Reach"
            desc="Fast and secure shipping from the USA to Lebanon."
          />
          <FeatureCard
            title="Real-Time Tracking"
            desc="Track your box anytime with full transparency."
          />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl bg-white/6 ring-1 ring-white/12 p-6
                 backdrop-blur-sm hover:bg-white/9 transition"
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/65">{desc}</div>
    </div>
  );
}
