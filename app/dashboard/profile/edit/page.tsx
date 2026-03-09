"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      const { data, error: userError } = await supabase
        .from("users")
        .select("id, full_name, phone, address")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const row = data as UserRow | null;

      setFullName(row?.full_name || "");
      setPhone(row?.phone || "");
      setAddress(row?.address || "");
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      setSaving(false);
      setError(authError.message);
      return;
    }

    if (!user) {
      setSaving(false);
      setError("No logged in user found");
      return;
    }

    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: cleanFullName,
        phone: cleanPhone,
        address: cleanAddress,
      })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Profile updated successfully");

    setTimeout(() => {
      router.push("/dashboard/profile");
    }, 1000);
  }

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
            Edit Profile
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Update your personal details below.
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-10 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFullName(e.target.value)
              }
              placeholder="Enter your full name"
              className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              Phone #
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPhone(e.target.value)
              }
              placeholder="Enter your phone number"
              className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAddress(e.target.value)
              }
              placeholder="Enter your address"
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#F5C84B]/60"
            />
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
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/profile")}
              className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
