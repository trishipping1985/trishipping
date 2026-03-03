import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

function normalizeStatus(raw: any) {
  const s = String(raw || "RECEIVED").trim().toUpperCase();
  return s || "RECEIVED";
}

function statusLabel(status: string) {
  switch (status) {
    case "READY_FOR_CONSOLIDATION":
      return "Ready For Consolidation";
    default:
      return status.replaceAll("_", " ");
  }
}

export default async function TrackResultPage({ params }: PageProps) {
  const { id } = await params;
  const trackingCode = decodeURIComponent(id || "").trim().toUpperCase();

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("packages")
    .select("tracking_code,status,photo_count")
    .eq("tracking_code", trackingCode)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#050914]">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081022]/80 p-8 text-white">
          <h1 className="text-3xl font-semibold text-[#f5c542]">Tracking Error</h1>
          <p className="mt-3 text-white/80">Could not load tracking right now.</p>
          <div className="mt-4 rounded-2xl bg-black/35 p-4 text-sm text-white/70 font-mono">
            {error.message}
          </div>
          <div className="mt-6">
            <Link className="text-[#f5c542] hover:underline" href="/track">
              Back to search
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#050914]">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081022]/80 p-10 text-white text-center">
          <h1 className="text-4xl font-semibold text-[#f5c542]">Tracking Not Found</h1>
          <p className="mt-3 text-white/70">
            No shipment was found for tracking code:
          </p>
          <div className="mt-2 text-2xl font-bold tracking-wider">{trackingCode}</div>

          <div className="mt-8">
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-[#f5c542] px-6 py-3 font-semibold text-black hover:opacity-90"
              href="/track"
            >
              Try another code
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = normalizeStatus(data.status);
  const photos = Number(data.photo_count ?? 0) || 0;

  return (
    <main className="min-h-screen px-4 py-10 bg-[#050914] text-white">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-[32px] border border-[#2b5cff30] bg-[linear-gradient(180deg,rgba(8,16,34,0.92),rgba(5,9,20,0.96))] p-8 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#f5c542]">
                Shipment Tracking
              </h1>
              <p className="mt-3 text-white/70 text-lg">
                Tracking code:{" "}
                <span className="font-semibold text-white">{trackingCode}</span>
              </p>
            </div>

            <Link
              href="/track"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white/85 hover:bg-white/10 transition"
            >
              New Search
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-8">
              <div className="text-white/55 uppercase tracking-[0.18em] text-xs">
                Current Status
              </div>

              <div className="mt-5">
                <div className="inline-flex items-center rounded-full border border-[#f5c542]/25 bg-[#f5c542]/10 px-5 py-2 text-[#f5c542] font-semibold tracking-wide">
                  {statusLabel(status)}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-8">
              <div className="text-white/55 uppercase tracking-[0.18em] text-xs">
                Photos
              </div>

              <div className="mt-5 text-6xl md:text-7xl font-extrabold text-white">
                {photos}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
