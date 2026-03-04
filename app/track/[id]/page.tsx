"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TrackResult =
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

export default function TrackByIdPage({ params }: { params: { id: string } }) {
  const code = useMemo(() => decodeURIComponent(params?.id || "").trim(), [params]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setData(null);

      if (!code) {
        setData({ ok: false, error: "Missing tracking code" });
        setLoading(false);
        return;
      }

      try {
        // Main call: dynamic route
        let res = await fetch(`/api/track/${encodeURIComponent(code)}`, {
          method: "GET",
          cache: "no-store",
        });

        // Fallback: query param
        if (!res.ok) {
          res = await fetch(`/api/track?code=${encodeURIComponent(code)}`, {
            method: "GET",
            cache: "no-store",
          });
        }

        const json = (await res.json()) as TrackResult;

        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setData({ ok: false, error: e?.message || "Request failed" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-900 bg-[#0f172a] p-10 text-center shadow-xl">
        <h1 className="text-4xl font-extrabold text-yellow-400">Tracking</h1>
        <p className="mt-2 text-gray-300">
          Tracking code: <span className="font-semibold text-white">{code || "—"}</span>
        </p>

        {loading && (
          <p className="mt-8 text-gray-300">Loading…</p>
        )}

        {!loading && data?.ok === false && (
          <>
            <h2 className="mt-8 text-3xl font-extrabold text-yellow-400">Error</h2>
            <p className="mt-3 text-gray-300">{data.error}</p>
            <div className="mt-8">
              <Link
                href="/track"
                className="inline-block rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
              >
                Try another code
              </Link>
            </div>
          </>
        )}

        {!loading && data?.ok === true && data.found === false && (
          <>
            <h2 className="mt-8 text-4xl font-extrabold text-yellow-400">
              Tracking Not Found
            </h2>
            <p className="mt-3 text-gray-300">
              No shipment was found for tracking code:
              <span className="ml-2 font-semibold text-white">{code}</span>
            </p>
            <div className="mt-8">
              <Link
                href="/track"
                className="inline-block rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
              >
                Try another code
              </Link>
            </div>
          </>
        )}

        {!loading && data?.ok === true && data.found === true && (
          <>
            <h2 className="mt-8 text-3xl font-extrabold text-yellow-400">
              Shipment Found ✅
            </h2>

            <div className="mt-6 rounded-xl bg-[#111827] p-6 text-left">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Status</div>
                <div className="text-lg font-bold text-white">{data.package.status}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-400">Tracking Code:</span>{" "}
                  {data.package.tracking_code}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Created:</span>{" "}
                  {new Date(data.package.created_at).toLocaleString()}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Package ID:</span> {data.package.id}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/track"
                className="inline-block rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
              >
                Track another shipment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
