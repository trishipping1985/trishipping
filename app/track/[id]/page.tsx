import Link from "next/link";

type TrackApiResponse =
  | { ok: false; error: string }
  | { ok: true; found: false }
  | {
      ok: true;
      found: true;
      package: {
        id: string;
        user_id: string;
        tracking_code: string;
        status: string;
        created_at: string;
      };
    };

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function TrackResultPage({
  params,
}: {
  params: { id?: string };
}) {
  const code = (params?.id || "").trim();

  if (!code) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-4 text-red-300 font-semibold">
            Missing tracking code
          </p>
          <div className="mt-6">
            <Link
              href="/track"
              className="inline-block rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Enter a tracking code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // IMPORTANT: no cache so Vercel always shows latest
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/track/${encodeURIComponent(code)}`, {
    cache: "no-store",
  }).catch(() => null);

  let data: TrackApiResponse | null = null;

  if (res && "json" in res) {
    try {
      data = (await res.json()) as TrackApiResponse;
    } catch {
      data = { ok: false, error: "Failed to read server response" };
    }
  } else {
    data = { ok: false, error: "Failed to reach tracking API" };
  }

  if (!data || data.ok === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-2 text-white/70">Tracking code: {code}</p>

          <h2 className="mt-6 text-3xl font-extrabold text-[#F5C84B]">
            Error
          </h2>
          <p className="mt-2 text-red-300 font-semibold">
            {"error" in (data || {}) ? (data as any).error : "Unknown error"}
          </p>

          <div className="mt-6">
            <Link
              href="/track"
              className="inline-block rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Try another code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (data.found === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-2 text-white/70">Tracking code: {code}</p>

          <h2 className="mt-6 text-3xl font-extrabold text-[#F5C84B]">
            Tracking Not Found
          </h2>
          <p className="mt-2 text-white/70">
            No shipment was found for this tracking code.
          </p>

          <div className="mt-6">
            <Link
              href="/track"
              className="inline-block rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Try another code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pkg = data.package;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-2 text-white/70">Tracking code: {pkg.tracking_code}</p>

          <h2 className="mt-8 text-5xl font-extrabold text-[#F5C84B]">
            Shipment Found ✅
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-white/70">Status</p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {pkg.status}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-white/70">Created</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatDate(pkg.created_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 md:col-span-2">
            <p className="text-white/70">Package ID</p>
            <p className="mt-2 text-white font-mono break-all">{pkg.id}</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/track"
            className="inline-block rounded-xl bg-[#F5C84B] px-8 py-4 font-bold text-black hover:opacity-90"
          >
            Track another shipment
          </Link>
        </div>
      </div>
    </main>
  );
}
