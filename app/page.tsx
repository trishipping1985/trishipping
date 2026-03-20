import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_20%),linear-gradient(180deg,#081020_0%,#050914_48%,#03060f_100%)]" />
        <div className="absolute left-1/2 top-[-170px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl sm:h-[460px] sm:w-[460px] lg:h-[680px] lg:w-[680px]" />
        <div className="absolute right-[-180px] top-[120px] h-[220px] w-[220px] rounded-full bg-[#1b2559]/30 blur-3xl sm:h-[360px] sm:w-[360px] lg:h-[620px] lg:w-[620px]" />
        <div className="absolute left-[-160px] top-[420px] h-[220px] w-[220px] rounded-full bg-[#0b1440]/30 blur-3xl sm:h-[360px] sm:w-[360px] lg:h-[560px] lg:w-[560px]" />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-6 pt-2 sm:px-6 sm:pb-10 sm:pt-5">
        <header className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl sm:rounded-[26px] sm:px-5 sm:py-4 md:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:p-[6px]">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping logo"
                width={64}
                height={64}
                className="h-[42px] w-[42px] rounded-xl object-contain sm:h-[60px] sm:w-[60px]"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4af37] sm:px-5 sm:py-2 sm:text-xs sm:tracking-[0.3em]">
                TRI Shipping
              </div>

              <div className="mt-1 text-[11px] text-white/55 sm:mt-2 sm:text-sm md:text-base">
                Premium logistics, forwarding, and tracking
              </div>
            </div>
          </div>
        </header>

        <section className="relative mt-4 overflow-hidden rounded-[22px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-5 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-7 sm:rounded-[32px] sm:px-6 sm:py-10 md:px-10 md:py-14 lg:rounded-[36px] lg:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(212,175,55,0.05),transparent)]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <div className="relative h-[260px] w-[260px] opacity-[0.05]">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping watermark"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="relative z-10 grid items-start gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d4af37] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.28em]">
                Luxury Meets Logistics
              </div>

              <h1 className="mt-3 max-w-4xl text-[27px] font-black leading-[1.02] tracking-tight text-white sm:mt-4 sm:text-5xl md:text-6xl xl:text-7xl">
                Premium shipping experience with real-time control.
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] leading-5 text-white/65 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
                Secure forwarding, transparent shipment tracking, and premium
                handling from start to finish.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">
                <Link
                  href="/track"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-[#050914] shadow-[0_18px_50px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:bg-[#e6c55a] sm:min-h-[54px] sm:px-7 sm:py-4 sm:tracking-[0.16em]"
                >
                  Track Shipment
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white/10 sm:min-h-[54px] sm:px-7 sm:py-4 sm:tracking-[0.16em]"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white/10 sm:min-h-[54px] sm:px-7 sm:py-4 sm:tracking-[0.16em]"
                >
                  Register
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-4">
                <MetricCard value="24/7" label="Tracking" />
                <MetricCard value="Secure" label="Handling" />
                <MetricCard value="Premium" label="Service" />
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.10),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[28px] sm:p-7">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4af37] sm:text-[11px] sm:tracking-[0.26em]">
                Why Clients Choose TRI
              </div>

              <h2 className="mt-2.5 max-w-md text-lg font-black tracking-tight text-white sm:mt-4 sm:text-3xl">
                Built for trust, clarity, and premium service
              </h2>

              <p className="mt-2.5 max-w-md text-sm leading-5 text-white/65 sm:mt-4 sm:text-base sm:leading-7">
                Transparent updates, professional handling, and a smoother
                logistics experience.
              </p>

              <div className="mt-3.5 space-y-2 sm:mt-5 sm:space-y-3">
                <ReasonItem text="Transparent shipment tracking" />
                <ReasonItem text="Premium handling standards" />
                <ReasonItem text="Fast access to shipment photos" />
                <ReasonItem text="Reliable updates on every movement" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-1 gap-2 sm:mt-6 sm:gap-4 md:grid-cols-3">
          <FeatureCard
            title="Handled With Care"
            desc="Processed with premium care from arrival to delivery."
          />
          <FeatureCard
            title="Global Forwarding"
            desc="Reliable international forwarding with a smoother workflow."
          />
          <FeatureCard
            title="Real-Time Tracking"
            desc="Live shipment updates with clear tracking visibility."
          />
        </section>
      </section>

      <footer className="mx-auto max-w-7xl px-4 pb-4 text-center text-[10px] text-white/45 sm:px-6 sm:pb-8 sm:text-xs">
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
    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#d4af37]/20 hover:bg-white/[0.06] sm:rounded-[28px] sm:p-6">
      <div className="text-[14px] font-bold text-white sm:text-xl">{title}</div>
      <div className="mt-1.5 text-[13px] leading-5 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
        {desc}
      </div>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2.5 text-center backdrop-blur-sm transition hover:border-[#d4af37]/15 hover:bg-black/25 sm:px-5 sm:py-5">
      <div className="text-base font-black text-[#d4af37] sm:text-2xl">{value}</div>
      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white/45 sm:mt-2 sm:text-xs sm:tracking-[0.22em]">
        {label}
      </div>
    </div>
  );
}

function ReasonItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5 sm:px-4 sm:py-4">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d4af37]" />
      <div className="text-sm leading-5 text-white/75 sm:text-[15px] sm:leading-6">
        {text}
      </div>
    </div>
  );
}
