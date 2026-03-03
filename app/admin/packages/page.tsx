"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPackagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function checkAccessAndLoad() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile || profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (!error) {
        setPackages(data || []);
      }

      setLoading(false);
    }

    checkAccessAndLoad();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function updatePackage(id: string, field: string, value: any) {
    await supabase.from("packages").update({ [field]: value }).eq("id", id);

    const { data } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    setPackages(data || []);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-8">
      <h1 className="text-3xl font-bold text-[#d4af37] mb-6">
        Admin Package Control
      </h1>

      <div className="space-y-4">
        {packages.map((p) => (
          <div
            key={p.id}
            className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10"
          >
            <div className="font-semibold text-lg">{p.tracking_code}</div>

            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <select
                value={p.status}
                onChange={(e) =>
                  updatePackage(p.id, "status", e.target.value)
                }
                className="bg-black text-white p-2 rounded"
              >
                <option>RECEIVED</option>
                <option>SORTED</option>
                <option>WEIGHED</option>
                <option>PHOTOGRAPHED</option>
                <option>READY_FOR_CONSOLIDATION</option>
                <option>CONSOLIDATED</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>
              </select>

              <input
                type="number"
                step="0.01"
                defaultValue={p.weight_kg ?? ""}
                placeholder="Weight kg"
                onBlur={(e) =>
                  updatePackage(
                    p.id,
                    "weight_kg",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="bg-black text-white p-2 rounded w-32"
              />

              <input
                type="number"
                defaultValue={p.photo_count ?? 0}
                placeholder="Photos"
                onBlur={(e) =>
                  updatePackage(
                    p.id,
                    "photo_count",
                    e.target.value ? Number(e.target.value) : 0
                  )
                }
                className="bg-black text-white p-2 rounded w-24"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
