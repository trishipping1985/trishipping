"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type IncomingPackageRow = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  original_tracking_number: string | null;
  store_name: string | null;
  notes: string | null;
  status: string;
  package_photo_url: string | null;
  tri_tracking_code: string | null;
  received_at: string | null;
  created_at: string | null;
};

type PackageInfoRow = {
  tracking_code: string;
  status: string | null;
  orders_count: number | null;
  photo_count: number | null;
};

type PackagePhotoRow = {
  id: string;
  tracking_code: string | null;
  public_url: string | null;
  file_path: string | null;
};

type GroupedReceivedPackage = {
  groupKey: string;
  triTrackingCode: string | null;
  customerName: string | null;
  storeName: string | null;
  notes: string | null;
  receivedAt: string | null;
  createdAt: string | null;
  fallbackStatus: string | null;
  originalTrackingNumbers: string[];
  mainPhotoUrl: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function normalizeStatus(status?: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function statusLabel(status?: string | null) {
  const cleanStatus = normalizeStatus(status);

  if (cleanStatus === "WAITING") return "WAITING";
  if (cleanStatus === "RECEIVED") return "RECEIVED";
  if (cleanStatus === "FORWARDED") return "FORWARDED";
  if (cleanStatus === "CANCELLED") return "CANCELLED";
  if (cleanStatus === "SHIPPED") return "SHIPPED";
  if (cleanStatus === "IN TRANSIT") return "IN TRANSIT";
  if (cleanStatus === "OUT FOR DELIVERY") return "OUT FOR DELIVERY";
  if (cleanStatus === "DELIVERED") return "DELIVERED";

  return cleanStatus || "RECEIVED";
}

function statusPillClass(status?: string | null) {
  const cleanStatus = normalizeStatus(status);

  if (cleanStatus === "DELIVERED") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (cleanStatus === "IN TRANSIT") {
    return "bg-sky-500/15 text-sky-300";
  }

  if (cleanStatus === "OUT FOR DELIVERY") {
    return "bg-orange-500/15 text-orange-300";
  }

  if (cleanStatus === "SHIPPED") {
    return "bg-indigo-500/15 text-indigo-300";
  }

  if (cleanStatus === "CANCELLED") {
    return "bg-red-500/15 text-red-300";
  }

  return "bg-[#d4af37]/15 text-[#d4af37]";
}

export default function CustomerReceivedPackagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<IncomingPackageRow[]>([]);
  const [packageInfoMap, setPackageInfoMap] = useState<
    Record<string, PackageInfoRow>
  >({});
  const [photoMap, setPhotoMap] = useState<Record<string, PackagePhotoRow[]>>(
    {}
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: incomingData, error: incomingError } = await supabase
        .from("incoming_packages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (incomingError) {
        setErrorMessage(incomingError.message);
        setLoading(false);
        return;
      }

      const incomingRows = (incomingData || []) as IncomingPackageRow[];

      const triCodes = Array.from(
        new Set(
          incomingRows
            .map((item) => item.tri_tracking_code)
            .filter((code): code is string => Boolean(code))
        )
      );

      let nextPackageInfoMap: Record<string, PackageInfoRow> = {};
      let nextPhotoMap: Record<string, PackagePhotoRow[]> = {};

      if (triCodes.length > 0) {
        const { data: packageInfoData, error: packageInfoError } =
          await supabase
            .from("packages")
            .select("tracking_code, status, orders_count, photo_count")
            .in("tracking_code", triCodes);

        if (packageInfoError) {
          setErrorMessage(packageInfoError.message);
        } else {
          nextPackageInfoMap = Object.fromEntries(
            ((packageInfoData || []) as PackageInfoRow[]).map((row) => [
              row.tracking_code,
              row,
            ])
          );
        }

        const { data: photoData, error: photoError } = await supabase
          .from("package_photos")
          .select("id, tracking_code, public_url, file_path")
          .in("tracking_code", triCodes);

        if (photoError) {
          setErrorMessage(photoError.message);
        } else {
          ((photoData || []) as PackagePhotoRow[]).forEach((photo) => {
            const code = photo.tracking_code || "";
            if (!code) return;

            if (!nextPhotoMap[code]) {
              nextPhotoMap[code] = [];
            }

            nextPhotoMap[code].push(photo);
          });
        }
      }

      if (mounted) {
        setPackages(incomingRows);
        setPackageInfoMap(nextPackageInfoMap);
        setPhotoMap(nextPhotoMap);
        setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [router]);

  const groupedPackages = useMemo(() => {
    const groupMap = new Map<string, GroupedReceivedPackage>();

    packages.forEach((item) => {
      const groupKey = item.tri_tracking_code || item.id;
      const existing = groupMap.get(groupKey);

      if (!existing) {
        groupMap.set(groupKey, {
          groupKey,
          triTrackingCode: item.tri_tracking_code,
          customerName: item.customer_name,
          storeName: item.store_name,
          notes: item.notes,
          receivedAt: item.received_at,
          createdAt: item.created_at,
          fallbackStatus: item.status,
          originalTrackingNumbers: item.original_tracking_number
            ? [item.original_tracking_number]
            : [],
          mainPhotoUrl: item.package_photo_url,
        });

        return;
      }

      if (item.original_tracking_number) {
        existing.originalTrackingNumbers.push(item.original_tracking_number);
      }

      if (!existing.mainPhotoUrl && item.package_photo_url) {
        existing.mainPhotoUrl = item.package_photo_url;
      }

      if (!existing.storeName && item.store_name) {
        existing.storeName = item.store_name;
      }

      if (!existing.notes && item.notes) {
        existing.notes = item.notes;
      }
    });

    return Array.from(groupMap.values());
  }, [packages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-4">
        Loading received packages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37]">
            Received Packages
          </h1>

          <p className="text-white/60 mt-2">
            These are packages TRI Shipping has received for you. The status
            shown here follows your TRI tracking status.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/30 p-4">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          {groupedPackages.length === 0 ? (
            <div className="bg-white/5 p-5 rounded-2xl ring-1 ring-white/10 text-white/60">
              No received packages yet. When TRI Shipping receives a package for
              you, it will appear here.
            </div>
          ) : (
            groupedPackages.map((group) => {
              const triCode = group.triTrackingCode || "";
              const packageInfo = triCode ? packageInfoMap[triCode] : null;
              const photos = triCode ? photoMap[triCode] || [] : [];

              const displayStatus =
                packageInfo?.status || group.fallbackStatus || "received";

              const packageCount =
                packageInfo?.orders_count ||
                group.originalTrackingNumbers.length ||
                1;

              const photoCount =
                photos.length || packageInfo?.photo_count || 0;

              return (
                <div
                  key={group.groupKey}
                  className="bg-white/5 p-4 md:p-5 rounded-2xl ring-1 ring-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white/60 text-sm">
                        TRI Tracking #
                      </div>

                      <div className="mt-1 text-lg md:text-xl font-bold break-words text-[#d4af37]">
                        {group.triTrackingCode || "Not assigned yet"}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-white/60">
                          Packages inside this TRI code:{" "}
                          <span className="text-white font-semibold">
                            {packageCount}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Photos:{" "}
                          <span className="text-white font-semibold">
                            {photoCount}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Store:{" "}
                          <span className="text-white">
                            {group.storeName || "—"}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Received:{" "}
                          <span className="text-white">
                            {formatDate(group.receivedAt || group.createdAt)}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Customer:{" "}
                          <span className="text-white">
                            {group.customerName || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-white/60 text-sm">
                          Package Original Tracking #
                        </div>

                        <div className="mt-2 space-y-2">
                          {group.originalTrackingNumbers.length === 0 ? (
                            <div className="rounded-xl bg-black/30 p-3 text-white">
                              No original tracking #
                            </div>
                          ) : (
                            group.originalTrackingNumbers.map(
                              (trackingNumber, index) => (
                                <div
                                  key={`${trackingNumber}-${index}`}
                                  className="rounded-xl bg-black/30 p-3 text-white break-words"
                                >
                                  {trackingNumber}
                                </div>
                              )
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-white/60">
                        Note:{" "}
                        <span className="text-white">
                          {group.notes || "—"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusPillClass(
                        displayStatus
                      )}`}
                    >
                      {statusLabel(displayStatus)}
                    </span>
                  </div>

                  {photos.length > 0 ? (
                    <div className="mt-5">
                      <div className="mb-3 text-sm font-semibold text-white/70">
                        Package Photos
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((photo, index) => (
                          <a
                            key={photo.id}
                            href={photo.public_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition hover:border-[#d4af37]/40"
                          >
                            {photo.public_url ? (
                              <img
                                src={photo.public_url}
                                alt={`Package photo ${index + 1}`}
                                className="h-32 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-32 items-center justify-center text-sm text-white/50">
                                Photo unavailable
                              </div>
                            )}

                            <div className="p-2 text-xs font-semibold text-[#d4af37]">
                              View Photo {index + 1}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : group.mainPhotoUrl ? (
                    <div className="mt-4">
                      <a
                        href={group.mainPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[#d4af37] underline font-semibold"
                      >
                        View package photo
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}