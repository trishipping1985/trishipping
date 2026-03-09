"use client";

import Link from "next/link";
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
  phone: string | null;
  address: string | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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

      const { data: appUser, error: userError } = await supabase
        .from("users")
        .select("email, full_name, phone, address")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const row = appUser as UserRow | null;

      setEmail(row?.email || user.email || "");
      setFullName(row?.full_name || "");
      setPhone(row?.phone || "");
      setAddress(row?.address || "");

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-[#071427]">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Dashboard Profile
          </p>

          <h1 className="mt-4 text-4xl font-bold text-[#F5C84B]">
            My Profile
          </h1>

          <p className="mt-2 text-white/60">
            Manage your account details
          </p>
        </div>

        <div className="mb-10 flex justify-center gap-4 flex-wrap">
          <Link
            href="/dashboard/profile/edit"
            className="rounded-xl bg-[#F5C84B] px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Edit Profile
          </Link>

          <Link
            href="/dashboard/profile/password"
            className="rounded-xl border border-[#F5C84B]/40 px-6 py-3 text-[#F5C84B] transition hover:bg-[#F5C84B]/10"
          >
            Change Password
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Full Name</span>
              <span>👤</span>
            </div>
            <div className="mt-2 text-xl font-semibold">
              {fullName || "Not set"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Email</span>
              <span>📧</span>
            </div>
            <div className="mt-2 break-all text-xl font-semibold">
              {email}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Phone #</span>
              <span>📱</span>
            </div>
            <div className="mt-2 text-xl font-semibold">
              {phone || "Not set"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Address</span>
              <span>📍</span>
            </div>
            <div className="mt-2 text-xl font-semibold">
              {address || "Not set"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
