"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

type PkgRow = {
  id?: string;
  tracking_code?: string | null;
  status?: string | null;
};

type PhotoItem = {
  name: string;
  url: string;
};

function normalizeStatus(raw: string) {
  const s = String(raw || "RECEIVED").trim();
  return s.toUpperCase().replace(/\s+/g, "_");
}

function statusLabel(status: string) {
  const s = normalizeStatus(status);
  if (s === "IN_TRANSIT") return "In Transit";
  if (s === "DELIVERED") return "Delivered";
  if (s === "RECEIVED") return "Received";
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusIcon(status: string) {
  const s = normalizeStatus(status);
  // Simple inline icons (no extra deps)
  if (s === "DELIVERED") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (s === "IN_TRANSIT") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 17h2l1.5-6h9l-1.5 6H21"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 11l2-4h3l1 4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }
  // RECEIVED / default = box
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8l-9-5-9 5 9 5 9-5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8v10l9 5 9-5V8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TrackResultPage({ params }: { params: { id: string } }) {
  const trackingCode = decodeURIComponent(params.id || "").trim();

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<PkgRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [photosLoading, setPhotosLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const currentStatus = useMemo(() => {
    return normalizeStatus(pkg?.status || "RECEIVED");
  }, [pkg?.status]);

  useEffect(() => {
    let cancelled = false;

    async function loadEverything() {
      setLoading(true);
      setNotFound(false);
      setPkg(null);
      setPhotos([]);
      setPhotosError(null);

      try {
        const supabase = getSupabase();

        // 1) Load package by tracking code
        const { data, error } = await supabase
          .from("packages")
          .select("id, tracking_code, status")
          .eq("tracking_code", trackingCode)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error(error);
          setNotFound(true);
          return;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        setPkg(data as PkgRow);

        // 2) Load photos from Storage: package-photos/<TRACKING_CODE>/*
        setPhotosLoading(true);

        const bucket = "package-photos";
        const folder = trackingCode;

        const listRes = await supabase.storage
          .from(bucket)
          .list(folder, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });

        if (cancelled) return;

        if (listRes.error) {
          console.error(listRes.error);
          setPhotosError(listRes.error.message || "Could not list photos");
          setPhotos([]);
          return;
        }

        const files = (listRes.data || []).filter((f) => !!f.name && f.name !== ".emptyFolderPlaceholder");

        const urls: PhotoItem[] = files.map((f) => {
          const path = `${folder}/${f.name}`;
          const pub = supabase.storage.from(bucket).getPublicUrl(path);
          return { name: f.name, url: pub.data.publicUrl };
        });

        setPhotos(urls);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPhotosLoading(false);
        }
      }
    }

    if (trackingCode) loadEverything();
    else {
      setLoading(false);
      setNotFound(true);
    }

    return () => {
      cancelled = true;
    };
  }, [trackingCode]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0b1220] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6">
          Loading tracking...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0b1220] text-white px-4">
        <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.03] p-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400">Tracking Not Found</h1>
          <p className="mt-4 text-white/75">No shipment was found for tracking code:</p>
          <div className="mt-2 text-2xl font-bold">{trackingCode}</div>

          <Link
            href="/track"
            className="inline-flex mt-8 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-yellow-400 tracking-tight">
          Shipment Tracking
        </h1>
        <div className="mt-2 text-white/80">
          Tracking code: <span className="font-semibold text-white">{trackingCode}</span>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status card */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
            <div className="text-white/60 text-sm tracking-[0.18em] uppercase">Current Status</div>

            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-5 py-2.5 text-yellow-300">
              <span className="inline-flex">{statusIcon(currentStatus)}</span>
              <span className="font-semibold">{statusLabel(currentStatus)}</span>
            </div>
          </div>

          {/* Photos summary card */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
            <div className="text-white/60 text-sm tracking-[0.18em] uppercase">Photos</div>
            <div className="mt-4 text-6xl font-extrabold">{photos.length}</div>
            <div className="mt-2 text-white/65 text-sm">
              Uploaded package images for this shipment.
            </div>
            {photosLoading && <div className="mt-3 text-white/60 text-sm">Loading photos…</div>}
            {photosError && <div className="mt-3 text-red-300 text-sm">{photosError}</div>}
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Package Photos</div>
            <div className="text-white/60 text-sm">
              Folder: <span className="text-white">{trackingCode}/</span>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="mt-6 text-white/65">No photos uploaded yet.</div>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-yellow-400/40"
                  title={p.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.name}
                    className="h-40 w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="px-3 py-2 text-xs text-white/70 truncate">
                    {p.name}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/track" className="text-yellow-300 hover:text-yellow-200 underline">
            Try another tracking code
          </Link>
        </div>
      </div>
    </div>
  );
}
