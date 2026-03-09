"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setError("Current password is required");
      return;
    }

    if (!cleanNew) {
      setError("New password is required");
      return;
    }

    if (cleanNew.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError("New password and confirm password do not match");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setSaving(false);
      setError(userError?.message || "No logged in user found");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: cleanCurrent,
    });

    if (signInError) {
      setSaving(false);
      setError("Current password is incorrect");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: cleanNew,
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Password updated successfully");

    setTimeout(() => {
      router.push("/dashboard/profile");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Dashboard Security
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Change Password
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Update your password to keep your account secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCurrentPassword(e.target.value)
              }
              placeholder="Enter current password"
              className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter new password"
              className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <label className="mb-2 block text-sm uppercase tracking-wider text-white/50">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
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
              {saving ? "Saving..." : "Update Password"}
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
