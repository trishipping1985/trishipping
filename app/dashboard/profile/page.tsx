"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  warehouse_id: string | null;
};

type WarehouseRow = {
  id: string;
  name: string | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("No logged in user found");
        setLoading(false);
        return;
      }

      const authEmail = user.email || "";
      const authFullName =
        String(user.user_metadata?.full_name || "").trim() ||
        String(user.user_metadata?.name || "").trim();

      const { data: appUser, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name, role, warehouse_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const currentUser = appUser as UserRow | null;

      setEmail(currentUser?.email || authEmail);
      setFullName(currentUser?.full_name || authFullName || "No name added");
      setRole(
        String(currentUser?.role || "client")
          .replace(/_/g, " ")
          .toUpperCase()
      );

      if (currentUser?.warehouse_id) {
        const { data: warehouseData } = await supabase
          .from("warehouses")
          .select("id, name")
          .eq("id", currentUser.warehouse_id)
          .maybeSingle();

        const warehouse = warehouseData as WarehouseRow | null;
        setWarehouseName(warehouse?.name || currentUser.warehouse_id);
      } else {
        setWarehouseName("No warehouse assigned");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="text-xl font-semibold">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Dashboard Profile
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            My Profile
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Your account details and access information.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Full Name
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{fullName}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Email
            </p>
            <p className="mt-3 break-all text-2xl font-bold text-white">
              {email || "No email found"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Role
            </p>
            <p className="mt-3 text-2xl font-bold text-[#F5C84B]">{role}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Warehouse
            </p>
            <p className="mt-3 text-2xl font-bold text-white">
              {warehouseName}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Access Summary
          </p>
          <p className="mt-3 text-white/85">
            {role === "ADMIN" || role === "OWNER"
              ? "You have full dashboard access across all warehouses."
              : role === "STAFF" || role === "STAFF2" || role === "STAFF4"
              ? "You can manage packages within your assigned warehouse."
              : "You can view only your own package activity and tracking details."}
          </p>
        </div>
      </div>
    </main>
  );
}
