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
      <main className="min-h-screen flex items-center justify-center bg-[#071427] text-white">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] px-4 py-8 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C84B]">
                Dashboard Profile
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">
                My Profile
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Manage your account details, contact information, and security settings from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/profile/edit"
                className="rounded-2xl bg-[#F5C84B] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.02] hover:opacity-95"
              >
                Edit Profile
              </Link>

              <Link
                href="/dashboard/profile/password"
                className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
              >
                Change Password
              </Link>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <ProfileCard
            label="Full Name"
            value={fullName || "Not set"}
            icon="👤"
          />

          <ProfileCard
            label="Email"
            value={email || "Not set"}
            icon="📧"
            breakAll
          />

          <ProfileCard
            label="Phone"
            value={phone || "Not set"}
            icon="📱"
          />

          <ProfileCard
            label="Address"
            value={address || "Not set"}
            icon="📍"
          />
        </section>
      </div>
    </main>
  );
}

function ProfileCard({
  label,
  value,
  icon,
  breakAll = false,
}: {
  label: string;
  value: string;
  icon: string;
  breakAll?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#F5C84B]/25 hover:shadow-[0_28px_70px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.10),transparent_35%)] opacity-80" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
            {label}
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 text-lg shadow-lg">
            {icon}
          </div>
        </div>

        <div
          className={`mt-5 text-xl font-bold text-white sm:text-2xl ${
            breakAll ? "break-all" : ""
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
