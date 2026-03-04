import Link from "next/link";

export default async function TrackPage({ params }: { params: { id: string } }) {
  const trackingCode = decodeURIComponent(params.id || "").trim();

  // Safety: if someone opens /track/ without a code
  if (!trackingCode) {
    return (
      <main className="min-h-screen bg-[#05070c] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border border-[#1c2b44] bg-[#070b14] p-10 shadow-[0_0_120px_rgba(245,158,11,0.08)] text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-yellow-400 drop-shadow">
            Tracking
          </h1>
          <p className="mt-4 text-gray-300">Missing tracking code</p>
          <Link
            href="/track"
            className="inline-flex mt-8 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300 transition"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "";

  // Fetch from your API route: /api/track/[code]
  const res = await fetch(`${baseUrl}/api/track/${encodeURIComponent(trackingCode)}`, {
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "Invalid response from server" };
  }

  const found = Boolean(data?.found);
  const pkg = data?.package || null;
  const status: string = (pkg?.status || "").toUpperCase();

  // Progress steps (your DB can store: RECEIVED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED)
  const STEPS = [
    { key: "RECEIVED", label: "Received", icon: "✔" },
    { key: "IN_TRANSIT", label: "In Transit", icon: "📦" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
    { key: "DELIVERED", label: "Delivered", icon: "🏁" },
  ];

  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status)
  );

  const isActive = (key: string) =>
    STEPS.findIndex((s) => s.key === key) <= currentIndex;

  const createdAtText = pkg?.created_at
    ? new Date(pkg.created_at).toLocaleString()
    : "—";

  return (
    <main className="min-h-screen bg-[#05070c] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="rounded-3xl border border-[#1c2b44] bg-[#070b14] p-10 shadow-[0_0_140px_rgba(245,158,11,0.09)]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full border border-[#1c2b44] bg-[#060a12] px-5 py-2 text-xs tracking-widest text-gray-300">
              TRI SHIPPING • TRACKING PORTAL
            </div>

            <h1 className="mt-6 text-6xl font-extrabold tracking-tight text-yellow-400 drop-shadow">
              Tracking
            </h1>

            <div className="mt-3 text-gray-300">
              Tracking code:{" "}
              <span className="font-semibold text-white">{trackingCode}</span>
            </div>

            {/* Result header */}
            <div className="mt-8">
              {data?.ok === false ? (
                <div className="mx-auto max-w-2xl rounded-2xl border border-red-900/60 bg-red-950/30 p-6">
                  <div className="text-2xl font-bold text-yellow-400">Error</div>
                  <div className="mt-2 text-gray-200">{data?.error || "Unknown error"}</div>

                  <Link
                    href="/track"
                    className="inline-flex mt-6 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300 transition"
                  >
                    Try another code
                  </Link>
                </div>
              ) : found ? (
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#1c2b44] bg-[#060a12] p-8">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-4xl font-extrabold text-yellow-400">
                      Shipment Found
                    </div>
                    <div className="text-3xl">✅</div>
                  </div>

                  {/* Luxury details */}
                  <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#1c2b44] bg-[#070b14] p-5">
                      <div className="text-xs uppercase tracking-widest text-gray-400">
                        Status
                      </div>
                      <div className="mt-2 text-xl font-bold text-white">
                        {status || "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#1c2b44] bg-[#070b14] p-5">
                      <div className="text-xs uppercase tracking-widest text-gray-400">
                        Created
                      </div>
                      <div className="mt-2 text-xl font-bold text-white">
                        {createdAtText}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#1c2b44] bg-[#070b14] p-5">
                      <div className="text-xs uppercase tracking-widest text-gray-400">
                        Package ID
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white break-all">
                        {pkg?.id || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Progress line */}
                  <div className="mt-10">
                    <div className="relative">
                      <div className="h-[2px] w-full rounded-full bg-[#1c2b44]" />
                      <div
                        className="absolute top-0 left-0 h-[2px] rounded-full bg-yellow-400 shadow-[0_0_22px_rgba(245,158,11,0.55)]"
                        style={{
                          width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="mt-8 grid grid-cols-4 gap-2">
                      {STEPS.map((s) => {
                        const active = isActive(s.key);
                        const current = s.key === status;
                        return (
                          <div key={s.key} className="text-center">
                            <div
                              className={[
                                "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border",
                                active
                                  ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_26px_rgba(245,158,11,0.25)]"
                                  : "border-[#1c2b44] bg-[#070b14]",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "text-3xl",
                                  active ? "" : "opacity-40",
                                ].join(" ")}
                              >
                                {s.icon}
                              </span>
                            </div>

                            <div
                              className={[
                                "mt-3 text-xs font-semibold tracking-widest uppercase",
                                current
                                  ? "text-yellow-400"
                                  : active
                                  ? "text-white"
                                  : "text-gray-500",
                              ].join(" ")}
                            >
                              {s.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href="/track"
                    className="inline-flex mt-10 items-center justify-center rounded-xl bg-yellow-400 px-7 py-3 font-semibold text-black hover:bg-yellow-300 transition"
                  >
                    Track another shipment
                  </Link>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl rounded-2xl border border-[#1c2b44] bg-[#060a12] p-8">
                  <div className="text-4xl font-extrabold text-yellow-400">
                    Tracking Not Found
                  </div>
                  <div className="mt-3 text-gray-300">
                    No shipment was found for tracking code:{" "}
                    <span className="font-semibold text-white">{trackingCode}</span>
                  </div>

                  <Link
                    href="/track"
                    className="inline-flex mt-8 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300 transition"
                  >
                    Try another code
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} TRI Shipping • Secure Tracking Experience
          </div>
        </div>
      </div>
    </main>
  );
}
