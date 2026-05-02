"use client";

import { useEffect, useState } from "react";
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

function statusLabel(status?: string | null) {
  const cleanStatus = String(status || "").toLowerCase();

  if (cleanStatus === "waiting") return "WAITING";
  if (cleanStatus === "received") return "RECEIVED AT WAREHOUSE";
  if (cleanStatus === "forwarded") return "FORWARDED";
  if (cleanStatus === "cancelled") return "CANCELLED";

  return cleanStatus ? cleanStatus.toUpperCase() : "WAITING";
}

export default function CustomerWarehousePackagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<IncomingPackageRow[]>([]);
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

      const { data, error } = await supabase
        .from("incoming_packages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else if (mounted) {
        setPackages((data || []) as IncomingPackageRow[]);
      }

      if (mounted) {
        setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-4">
        Loading warehouse packages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37]">
            Warehouse Packages
          </h1>

          <p className="text-white/60 mt-2">
            These are packages TRI Shipping has received or added for you.
            Once a TRI tracking number is assigned, it will appear here.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/30 p-4">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          {packages.length === 0 ? (
            <div className="bg-white/5 p-5 rounded-2xl ring-1 ring-white/10 text-white/60">
              No warehouse packages yet. When TRI Shipping receives a package
              for you, it will appear here.
            </div>
          ) : (
            packages.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 p-4 md:p-5 rounded-2xl ring-1 ring-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg md:text-xl font-bold break-words">
                      {item.original_tracking_number || "No original tracking #"}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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

                  <span className="w-fit rounded-full bg-[#d4af37]/15 text-[#d4af37] px-3 py-1 text-xs font-bold">
                    {statusLabel(item.status)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}