import Link from "next/link";
import Image from "next/image";

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
        <header className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-white/90 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping logo"
                width={60}
                height={60}
                className="h-[60px] w-[60px] rounded-xl object-contain"
                priority
              />
            </div>

            <div>
              <div className="inline-flex items-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">
                TRI Shipping
              </div>
              <div className="mt-2 text-sm text-white/55">
                Premium logistics, forwarding, and tracking
              </div>
            </div>
          </div>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[36px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-14 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-10 md:py-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(212,175,55,0.05),transparent)]" />

          <div className="pointer-events-none absolute left-6 top-10 hidden lg:block">
            <div className="relative h-[260px] w-[260px] opacity-[0.06]">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping watermark"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                Luxury Meets Logistics
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl xl:text-7xl">
                Premium shipping experience with real-time control.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
                TRI Shipping gives you a modern logistics experience with secure
                forwarding, transparent shipment tracking, and premium handling
                from start to finish.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/track"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#050914] shadow-[0_18px_50px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:bg-[#e6c55a]"
                >
                  Track Your Shipment
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
                >
                  Client Login
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard value="24/7" label="Tracking Access" />
                <MetricCard value="Secure" label="Shipment Handling" />
                <MetricCard value="Premium" label="Client Experience" />
              </div>
            </div>

            <div className="rounded-[30px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d4af37]">
                Why Clients Choose TRI
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                Built for trust, clarity, and premium service
              </h2>

              <p className="mt-5 text-base leading-8 text-white/65">
                Customers choose TRI Shipping for transparent updates,
                professional handling, and a smoother logistics experience from
                start to finish.
              </p>

              <div className="mt-8 space-y-4">
                <ReasonItem text="Transparent shipment tracking" />
                <ReasonItem text="Premium handling standards" />
                <ReasonItem text="Fast access to shipment photos" />
                <ReasonItem text="Reliable updates on every movement" />
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
            desc="Customers can follow their shipments with live status updates and transparency."
          />
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

function ReasonItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
      <div className="text-sm leading-7 text-white/75">{text}</div>
    </div>
  );
}
