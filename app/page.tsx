import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />
        <div className="absolute left-1/2 top-[-200px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-220px] top-[220px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-[-220px] top-[520px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
            <span className="text-lg font-semibold">TRI</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-wide">TRI Shipping</div>
            <div className="text-xs text-white/60">Client Dashboard</div>
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
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-white/90 transition"
          >
            Open Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/15 px-4 py-2 text-xs text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
          Door-to-door logistics dashboard
        </div>

        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
          Track. Consolidate. Ship.
          <span className="block text-white/70">
            All your packages in one place.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base md:text-lg text-white/70">
          Manage incoming items, photos, labels, and status updates — built for
          fast international forwarding and clear client visibility.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold bg-white text-black hover:bg-white/90 transition"
          >
            Sign in to your account
          </Link>
          <Link
            href="/track/demo"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/15 transition"
          >
            View tracking demo
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Package timeline",
              desc: "See every status update from received to delivered.",
            },
            {
              title: "Photos & verification",
              desc: "Item photos, condition checks, and clear records.",
            },
            {
              title: "Labels & QR codes",
              desc: "Generate labels for fast sorting and tracking.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 hover:bg-white/7 transition"
            >
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="mt-2 text-sm text-white/65">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-white/50">
        © {new Date().getFullYear()} TRI Shipping. All rights reserved.
      </footer>
    </main>
  );
}
