"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  tracking_code: string;
  assigned_staff_id: string | null;
};

type StaffRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

export default function AssignStaffPage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = decodeURIComponent(String(params.code || ""))
    .trim()
    .toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const { data: packageData, error: packageError } = await supabase
        .from("packages")
        .select("id, tracking_code, assigned_staff_id")
        .eq("tracking_code", codeParam)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (packageError) {
        setLoading(false);
        setError(packageError.message);
        return;
      }

      if (!packageData) {
        setLoading(false);
        setError("Package not found");
        return;
      }

      const { data: staffData, error: staffError } = await supabase
        .from("users")
        .select("id, email, full_name, role")
        .in("role", ["staff", "staff2", "staff4", "admin"])
        .order("created_at", { ascending: true });

      if (staffError) {
        setLoading(false);
        setError(staffError.message);
        return;
      }

      setPkg(packageData as PackageRow);
      setSelectedStaffId((packageData as PackageRow).assigned_staff_id || "");
      setStaffList((staffData || []) as StaffRow[]);
      setLoading(false);
    }

    if (codeParam) loadData();
  }, [codeParam]);

  async function handleSave() {
    if (!pkg) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("packages")
      .update({
        assigned_staff_id: selectedStaffId || null,
      })
      .eq("id", pkg.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Staff assigned successfully");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="text-xl font-semibold">Loading assignment page...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Admin Staff Assignment
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Assign Staff
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Tracking Code: {pkg?.tracking_code || codeParam}
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Select Staff
            </label>

            <select
              value={selectedStaffId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedStaffId(e.target.value)
              }
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none focus:border-[#F5C84B]/60"
            >
              <option value="">Unassigned</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {(staff.full_name || staff.email || staff.id) +
                    (staff.role ? ` — ${staff.role}` : "")}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Assignment"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/packages")}
              className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
            >
              Back to Packages
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
