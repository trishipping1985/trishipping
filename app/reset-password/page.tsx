"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function prepareResetSession() {
      setChecking(true);
      setErrorMessage("");

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setErrorMessage("Reset link is invalid or expired. Please request a new one.");
          setChecking(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setErrorMessage("Reset link is invalid or expired. Please request a new one.");
          setChecking(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setErrorMessage("Reset session not found. Please request a new password reset link.");
        setReady(false);
      } else {
        setReady(true);
      }

      setChecking(false);
    }

    prepareResetSession();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage("Could not update password. Please request a new reset link.");
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setPassword("");
    setConfirmPassword("");

    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>

        <p className="mt-2 text-sm text-slate-600">
          Create a new password for your TRI Shipping account.
        </p>

        {checking && (
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            Checking reset link...
          </div>
        )}

        {!checking && errorMessage && (
          <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {!checking && message && (
          <div className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {!checking && ready && !message && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />

            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
