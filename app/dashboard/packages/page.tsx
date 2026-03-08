"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  tracking_code: string;
  status: string | null;
  weight_kg: number | null;
  photo_count: number | null;
};

type UserRow = {
  id: string;
  role: string | null;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: currentUser } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        const role = String(((currentUser as UserRow | null)?.role || ""))
          .trim()
          .toLowerCase();

        setIsAdmin(role === "admin" || role === "owner");
      } else {
        setIsAdmin(false);
      }

      const { data } = await supabase
        .from("packages")
        .select("id, tracking_code, status, weight_kg, photo_count")
        .order("created_at", { ascending: false });

      setPackages((data || []) as PackageRow[]);
      setLoading(false);
    }

    loadPage();
  }, []);

  const filteredPackages = packages.filter((pkg) =>
    (pkg.tracking_code || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-[#F5C84B]">Packages</h1>
            <p className="mt-2 text-white/65">
              Manage shipments, search tracking codes, and edit package details.
            </p>
          </div>

          {isAdmin ? (
            <Link
              href="/dashboard/packages/add"
              className="rounded-2xl bg-[#F5C84B] px-6 py-4 text-center text-lg font-bold text-black hover:opacity-90"
            >
              Add Box
            </Link>
          ) : null}
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            placeholder="Search by tracking code"
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading packages...
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No packages found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-[#F5C84B]">
                      {pkg.tracking_code}
                    </h2>

                    <div className="mt-3 space-y-1 text-white/80">
                      <p>Status: {pkg.status || "Not set"}</p>
                      <p>
                        Weight:{" "}
                        {pkg.weight_kg === null || pkg.weight_kg === undefined
                          ? "Not added"
                          : `${pkg.weight_kg} kg`}
                      </p>
                      <p>Photos: {pkg.photo_count ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                      className="rounded-2xl border border-white/15 bg-black/20 px-5 py-3 text-center font-bold text-white hover:bg-black/30"
                    >
                      View Track
                    </Link>

                    {isAdmin ? (
                      <>
                        <Link
                          href={`/dashboard/packages/edit/${encodeURIComponent(
                            pkg.tracking_code
                          )}`}
                          className="rounded-2xl bg-[#F5C84B] px-5 py-3 text-center font-bold text-black hover:opacity-90"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/dashboard/packages/status/${encodeURIComponent(
                            pkg.tracking_code
                          )}`}
                          className="rounded-2xl border border-[#F5C84B]/40 bg-[#F5C84B]/10 px-5 py-3 text-center font-bold text-[#F5C84B] hover:bg-[#F5C84B]/20"
                        >
                          Update Status
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
