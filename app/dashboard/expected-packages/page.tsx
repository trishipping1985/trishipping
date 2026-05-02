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

type PackageStatusRow = {
  tracking_code: string;
  status: string | null;
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
  const [packageStatusMap, setPackageStatusMap] = useState<
    Record<string, string | null>
  >({});
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

      let statusMap: Record<string, string | null> = {};

      if (triCodes.length > 0) {
        const { data: packageStatusData, error: packageStatusError } =
          await supabase
            .from("packages")
            .select("tracking_code, status")
            .in("tracking_code", triCodes);

        if (packageStatusError) {
          setErrorMessage(packageStatusError.message);
        } else {
          statusMap = Object.fromEntries(
            ((packageStatusData || []) as PackageStatusRow[]).map((row) => [
              row.tracking_code,
              row.status,
            ])
          );
        }
      }

      if (mounted) {
        setPackages(incomingRows);
        setPackageStatusMap(statusMap);
        setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [router]);

  const groupedPackages = useMemo(() => {
    return packages;
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
            groupedPackages.map((item) => {
              const livePackageStatus = item.tri_tracking_code
                ? packageStatusMap[item.tri_tracking_code]
                : null;

              const displayStatus = livePackageStatus || item.status;

              return (
                <div
                  key={item.id}
                  className="bg-white/5 p-4 md:p-5 rounded-2xl ring-1 ring-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white/60 text-sm">
                        Package Original Tracking #
                      </div>

                      <div className="mt-1 text-lg md:text-xl font-bold break-words">
                        {item.original_tracking_number ||
                          "No original tracking #"}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-white/60">
                          Store:{" "}
                          <span className="text-white">
                            {item.store_name || "—"}
                          </span>
                        </div>

                        <div className="text-white/60">
                          TRI Tracking:{" "}
                          <span className="text-white">
                            {item.tri_tracking_code || "Not assigned yet"}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Received:{" "}
                          <span className="text-white">
                            {formatDate(item.received_at || item.created_at)}
                          </span>
                        </div>

                        <div className="text-white/60">
                          Customer:{" "}
                          <span className="text-white">
                            {item.customer_name || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-white/60">
                        Note:{" "}
                        <span className="text-white">{item.notes || "—"}</span>
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

                  {item.package_photo_url ? (
                    <div className="mt-4">
                      <a
                        href={item.package_photo_url}
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