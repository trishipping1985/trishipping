import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams?: { code?: string };
}) {
  const code = decodeURIComponent(searchParams?.code || "").trim().toUpperCase();

  if (!code) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-3 text-white/70">
            Enter your tracking code to view shipment status.
          </p>

          <form action="/track" method="GET" className="mt-8 flex gap-3">
            <input
              name="code"
              placeholder="Enter tracking code (e.g. TRI-001)"
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#F5C84B]/60"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Track
            </button>
          </form>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("packages")
    .select("id, tracking_code, status, created_at")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-4xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-2 text-white/70">Tracking code: {code}</p>
          <p className="mt-6 text-red-300 font-semibold">{error.message}</p>
          <Link
            href="/track"
            className="mt-6 inline-block rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
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
          <Link
            href="/track"
            className="mt-6 inline-block rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-2 text-white/70">Tracking code: {data.tracking_code}</p>
          <h2 className="mt-8 text-5xl font-extrabold text-[#F5C84B]">
            Shipment Found ✅
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-white/70">Status</p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {data.status}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-white/70">Created</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatDate(data.created_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 md:col-span-2">
            <p className="text-white/70">Package ID</p>
            <p className="mt-2 break-all font-mono text-white">{data.id}</p>
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
