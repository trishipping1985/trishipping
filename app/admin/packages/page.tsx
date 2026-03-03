"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPackages() {
    const { data } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    setPackages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPackages();
  }, []);

  async function updatePackage(id: string, field: string, value: any) {
    await supabase
      .from("packages")
      .update({ [field]: value })
      .eq("id", id);

    loadPackages();
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold text-[#d4af37] mb-6">
        Admin Package Control
      </h1>

      <div className="space-y-4">
        {packages.map((p) => (
          <div
            key={p.id}
            className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10"
          >
            <div className="font-semibold">{p.tracking_code}</div>

            <div className="mt-2 flex gap-3 items-center">
              <select
                value={p.status}
                onChange={(e) =>
                  updatePackage(p.id, "status", e.target.value)
                }
                className="bg-black text-white p-2 rounded"
              >
                <option>RECEIVED</option>
                <option>IN TRANSIT</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>
              </select>

              <input
                type="number"
                placeholder="Weight kg"
                defaultValue={p.weight_kg || ""}
                onBlur={(e) =>
                  updatePackage(
                    p.id,
                    "weight_kg",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="bg-black text-white p-2 rounded w-28"
              />

              <input
                type="number"
                placeholder="Photos"
                defaultValue={p.photo_count}
                onBlur={(e) =>
                  updatePackage(
                    p.id,
                    "photo_count",
                    Number(e.target.value)
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
