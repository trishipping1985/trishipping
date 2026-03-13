import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_24%),linear-gradient(180deg,#081020_0%,#050914_48%,#03060f_100%)]" />
        <div className="absolute left-1/2 top-[-220px] h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#d4af37]/12 blur-3xl" />
        <div className="absolute right-[-260px] top-[180px] h-[640px] w-[640px] rounded-full bg-[#1b2559]/40 blur-3xl" />
        <div className="absolute left-[-260px] top-[560px] h-[620px] w-[620px] rounded-full bg-[#0b1440]/40 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">
              TRI Shipping
            </div>
            <div className="mt-2 text-sm text-white/55">
              Premium logistics, forwarding, and tracking
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/track"
              className="inline-flex items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#d4af37] transition hover:bg-[#d4af37]/20"
            >
              Track
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[36px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-14 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-10 md:py-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(212,175,55,0.05),transparent)]" />

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                Luxury Meets Logistics
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl xl:text-7xl">
                Premium shipping experience with real-time control.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
                TRI Shipping gives you a modern logistics experience with secure
                forwarding, transparent shipment tracking, premium handling, and
                a dashboard built for both customers and operations teams.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/track"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#050914] shadow-[0_18px_50px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:bg-[#e6c55a]"
                >
                  Track Your Shipment
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
                >
                  Create Account
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d4af37]/25 bg-[#1b2559]/60 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#23307a]"
                >
                  Open Dashboard
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard value="24/7" label="Tracking Access" />
                <MetricCard value="Secure" label="Shipment Handling" />
                <MetricCard value="Premium" label="Client Experience" />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-black/20 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                Live Shipment Panel
              </div>

              <div className="mt-5 rounded-2xl border border-[#d4af37]/15 bg-[#0a1224] p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Tracking Code
                </div>
                <div className="mt-2 text-3xl font-black tracking-wide text-[#d4af37]">
                  TRI-837
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                    Current Status
                  </span>
                  <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                    In Transit
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <TimelineItem label="Received" active />
                  <TimelineItem label="In Transit" active />
                  <TimelineItem label="Out for Delivery" />
                  <TimelineItem label="Delivered" />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Why clients choose TRI
                </div>

                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li>• Transparent shipment tracking</li>
                  <li>• Premium handling standards</li>
                  <li>• Fast access to shipment photos</li>
                  <li>• Reliable updates for every movement</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            title="Handled With Care"
            desc="Every package is processed with premium care standards, from arrival to final delivery."
          />
          <FeatureCard
            title="Global Forwarding"
            desc="Seamless forwarding workflows designed for international shipping and customer confidence."
          />
          <FeatureCard
            title="Real-Time Tracking"
            desc="Customers can follow their shipments with live status updates, tracking history, and transparency."
          />
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d4af37]">
              How It Works
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              A smoother shipping experience from start to finish
            </h2>

            <div className="mt-8 space-y-5">
              <StepCard
                number="01"
                title="Create or receive shipment"
                desc="Packages are logged into the system with tracking, customer details, and warehouse visibility."
              />
              <StepCard
                number="02"
                title="Track and update progress"
                desc="Staff can update status, upload shipment photos, and keep customers informed."
              />
              <StepCard
                number="03"
                title="Deliver with full transparency"
                desc="Clients stay informed through tracking history, notifications, and delivery confirmation."
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d4af37]">
              Client Portal
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Built for trust, clarity, and premium service
            </h2>

            <p className="mt-5 text-base leading-8 text-white/65">
              Customers can log in, review their profile, access package
              updates, see shipment history, and track every movement in one
              refined experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#050914] transition hover:bg-[#e6c55a]"
              >
                Client Login
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              >
                Register
              </Link>
            </div>
          </div>
        </section>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#d4af37]/20 hover:bg-white/[0.06]">
      <div className="text-xl font-bold text-white">{title}</div>
      <div className="mt-3 text-sm leading-7 text-white/65">{desc}</div>
    </div>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-5 backdrop-blur-sm">
      <div className="text-2xl font-black text-[#d4af37]">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-3.5 w-3.5 rounded-full border ${
          active
            ? "border-[#d4af37] bg-[#d4af37]"
            : "border-white/20 bg-transparent"
        }`}
      />
      <div className={active ? "text-white font-semibold" : "text-white/50"}>
        {label}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d4af37]">
        {number}
      </div>
      <div className="mt-2 text-lg font-bold text-white">{title}</div>
      <div className="mt-2 text-sm leading-7 text-white/65">{desc}</div>
    </div>
  );
}
