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
  return status.replaceAll("_", " ");
}

function statusDotColor(status: string) {
  if (status === "DELIVERED") return "bg-emerald-400";
  if (status === "SHIPPED") return "bg-sky-400";
  return "bg-[#f5c542]";
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
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081022]/60 p-8 text-white">
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
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#081022]/60 p-10 text-white text-center">
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
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-[#f5c542]">
              Shipment Tracking
            </h1>
            <p className="mt-2 text-white/70">
              Tracking code: <span className="font-semibold text-white">{trackingCode}</span>
            </p>
          </div>

          <Link
            href="/track"
            className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-white/85 hover:bg-black/30"
          >
            New Search
          </Link>
        </div>

        <div className="mt-8 rounded-3xl border border-[#2b5cff3a] bg-[#081022]/55 p-8 backdrop-blur">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-7">
              <div className="text-white/70">Current Status</div>

              <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-5 py-3">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${statusDotColor(
                      status
                    )}`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${statusDotColor(
                      status
                    )}`}
                  />
                </span>

                <span className="text-xl font-semibold text-[#f5c542]">
                  {statusLabel(status)}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-7">
              <div className="text-white/70">Photos</div>
              <div className="mt-3 text-5xl font-bold text-white">{photos}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
