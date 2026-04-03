
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
};

type PackageRow = {
  id: string;
  user_id: string | null;
  tracking_code: string;
  status: string | null;
  warehouse_id: string | null;
};

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function badgeClasses(status: string | null) {
  const s = normalizeStatus(status);

  if (s === "RECEIVED") {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-300";
  }

  if (s === "IN TRANSIT") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-300";
  }

  if (s === "OUT FOR DELIVERY") {
    return "border-orange-400/30 bg-orange-500/15 text-orange-300";
  }

  if (s === "DELIVERED") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  return "border-white/10 bg-black/20 text-white/80";
}

export default function DashboardTrackingPhotosPage() {
  const params = useParams();
  const rawId = String(params.id || "");
  const trackingCode = decodeURIComponent(rawId).trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    async function loadPhotosPage() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(authError?.message || "User not found");
        setLoading(false);
        return;
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("id, role, warehouse_id")
        .eq("id", user.id)
        .maybeSingle();

      if (currentUserError) {
        setError(currentUserError.message);
        setLoading(false);
        return;
      }

      const userRow = currentUser as UserRow | null;
      const role = normalizeRole(userRow?.role);
      const warehouseId = userRow?.warehouse_id || null;

      const adminMode = role === "admin" || role === "owner";
      const warehouseStaffMode =
        role === "staff" || role === "staff2" || role === "staff4";

      let packageQuery = supabase
        .from("packages")
        .select("id, user_id, tracking_code, status, warehouse_id")
        .eq("tracking_code", trackingCode)
        .order("created_at", { ascending: false })
        .limit(1);

      if (adminMode) {
        // all allowed
      } else if (warehouseStaffMode && warehouseId) {
        packageQuery = packageQuery.eq("warehouse_id", warehouseId);
      } else {
        packageQuery = packageQuery.eq("user_id", user.id);
      }

      const { data: packageData, error: packageError } =
        await packageQuery.maybeSingle();

      if (packageError) {
        setError(packageError.message);
        setLoading(false);
        return;
      }

      if (!packageData) {
        setError("Package not found or access denied");
        setLoading(false);
        return;
      }

      const foundPackage = packageData as PackageRow;
      setPkg(foundPackage);

      const { data: photoList, error: photoListError } = await supabase.storage
        .from("package-photos")
        .list(trackingCode, {
          limit: 100,
          sortBy: { column: "name", order: "desc" },
        });

      if (photoListError) {
        setError(photoListError.message);
        setPhotoUrls([]);
        setLoading(false);
        return;
      }

      const urls =
        (photoList || [])
          .filter((file) => !!file.name)
          .map((file) => {
            const { data } = supabase.storage
              .from("package-photos")
              .getPublicUrl(`${trackingCode}/${file.name}`);

            return data.publicUrl;
          }) || [];

      setPhotoUrls(urls);
      setLoading(false);
    }

    if (trackingCode) {
      loadPhotosPage();
    }
  }, [trackingCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] px-3 py-6 text-white sm:px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-12 text-center text-white/60">
            Loading package photos...
          </div>
        </div>
      </main>
    );
  }

  if (error || !pkg) {
    return (
      <main className="min-h-screen bg-[#071427] px-3 py-6 text-white sm:px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-5 py-8 text-center">
            <div className="text-xl font-bold text-red-300">
              {error || "Page not found"}
            </div>

            <div className="mt-5">
              <Link
                href="/dashboard/package-photos"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Back to Package Photos
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-20 top-0 h-36 w-36 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-52 sm:w-52 lg:h-56 lg:w-56" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                Package Photos
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                {pkg.tracking_code}
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                View all uploaded photos for this package.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] ${badgeClasses(
                  pkg.status
                )}`}
              >
                {normalizeStatus(pkg.status) || "NOT SET"}
              </span>

              <Link
                href="/dashboard/package-photos"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Back
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-bold text-[#F5C84B] sm:text-2xl">
                Photo Gallery
              </h2>
              <p className="mt-1 text-sm text-white/55">
                Uploaded package photos for this tracking code.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75">
              {photoUrls.length} photo{photoUrls.length === 1 ? "" : "s"}
            </span>
          </div>

          {photoUrls.length === 0 ? (
            <div className="px-5 py-12 text-center text-white/60">
              No package photos uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
              {photoUrls.map((url, index) => (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] transition hover:border-[#F5C84B]/20 hover:opacity-95"
                >
                  <img
                    src={url}
                    alt={`Package photo ${index + 1}`}
                    className="h-64 w-full object-cover sm:h-72"
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
