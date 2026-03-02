import Link from "next/link";

export default function TrackResultPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  // Demo timeline (we’ll replace with Supabase later)
  const events = [
    { title: "Received at warehouse", date: "Demo" },
    { title: "Processing & photos", date: "Demo" },
    { title: "Ready for shipment", date: "Demo" },
  ];

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
          href="/track"
          className="rounded-lg px-4 py-2 text-sm font-semibold
                     bg-white/5 ring-1 ring-white/15
                     hover:bg-white/10 transition"
        >
          New search
        </Link>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/6 ring-1 ring-white/12 p-7 backdrop-blur-sm">
          <h1
            className="text-2xl font-bold tracking-tight
                       bg-gradient-to-r from-[#d4af37] via-[#f5dd90] to-[#d4af37]
                       bg-clip-text text-transparent"
          >
            Tracking details
          </h1>

          <p className="mt-2 text-sm text-white/65">
            Tracking number: <span className="text-white">{id}</span>
          </p>

          <div className="mt-8 space-y-4">
            {events.map((e) => (
              <div
                key={e.title}
                className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5"
              >
                <div className="text-sm font-semibold text-[#f5dd90]">
                  {e.title}
                </div>
                <div className="mt-1 text-xs text-white/50">{e.date}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-xs text-white/45">
            This is a demo timeline. Next step: connect to Supabase tracking
            events.
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} TRI Shipping. Luxury meets logistics.
      </footer>
    </main>
  );
}
