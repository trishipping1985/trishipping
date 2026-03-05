import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function TrackResultPage({
  params,
}: {
  params: { id?: string };
}) {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const pathnameHint = h.get("x-invoke-path") || "";

  const rawParam = params?.id ?? "";
  const code = decodeURIComponent(String(rawParam || "")).trim().toUpperCase();

  // DEBUG BOX (always visible)
  const DebugBox = () => (
    <div className="mb-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left text-xs text-white/70">
      <div className="font-bold text-yellow-300">DEBUG</div>
      <div>host: <span className="text-white">{host || "null"}</span></div>
      <div>proto: <span className="text-white">{proto}</span></div>
      <div>pathnameHint: <span className="text-white">{pathnameHint || "empty"}</span></div>
      <div>params.id: <span className="text-white">{String(params?.id)}</span></div>
      <div>decoded code: <span className="text-white">{code || "EMPTY"}</span></div>
      <div className="mt-2 text-white/60">
        Expected URL format: <span className="text-white">/track/TRI-001</span>
      </div>
    </div>
  );

  // If code is empty here, Next is NOT passing the dynamic route param.
  if (!code) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <DebugBox />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-4xl font-extrabold text-yellow-400">Tracking</h1>
            <p className="mt-4 text-red-300 font-semibold">Missing tracking code</p>
            <Link
              href="/track"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Go to /track
            </Link>
          </div>
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
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <DebugBox />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-4xl font-extrabold text-yellow-400">Error</h1>
            <p className="mt-4 text-red-300 font-semibold">{error.message}</p>
            <Link
              href="/track"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Try another code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <DebugBox />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-4xl font-extrabold text-yellow-400">Not Found</h1>
            <p className="mt-3 text-white/70">Tracking code: {code}</p>
            <p className="mt-4 text-red-300 font-semibold">No shipment found</p>
            <Link
              href="/track"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:opacity-90"
            >
              Try another code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <DebugBox />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-yellow-400">Shipment Found ✅</h1>
            <p className="mt-2 text-white/70">Tracking code: {data.tracking_code}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <p className="text-white/70">Status</p>
              <p className="mt-2 text-3xl font-extrabold">{data.status}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <p className="text-white/70">Created</p>
              <p className="mt-2 text-xl font-semibold">
                {new Date(data.created_at).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 md:col-span-2">
              <p className="text-white/70">Package ID</p>
              <p className="mt-2 font-mono break-all">{data.id}</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/track"
              className="inline-block rounded-xl bg-yellow-400 px-8 py-4 font-bold text-black hover:opacity-90"
            >
              Track another shipment
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
