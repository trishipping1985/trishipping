"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          phone: cleanPhone,
          address: cleanAddress,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
          address: cleanAddress,
        })
        .eq("id", userId);

      if (updateError) {
        setLoading(false);
        setError(updateError.message);
        return;
      }
    }

    setLoading(false);
    setSuccess("Account created successfully");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,200,75,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%)]" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-[linear-gradient(180deg,rgba(245,200,75,0.10),rgba(255,255,255,0.02))] p-10">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-white/45">
                  TRI Shipping
                </p>

                <h1 className="mt-6 text-5xl font-extrabold leading-tight text-[#F5C84B]">
                  Luxury logistics,
                  <br />
                  built for trust.
                </h1>

                <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
                  Create your account to track shipments, manage deliveries, and
                  access your shipping dashboard with a premium experience.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                    Secure Access
                  </p>
                  <p className="mt-2 text-white/80">
                    Your shipments and account information stay organized in one
                    private dashboard.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/45">
                    Premium Tracking
                  </p>
                  <p className="mt-2 text-white/80">
                    Follow package movement with real shipment status and photo
                    updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="text-center lg:text-left">
                <p className="text-sm uppercase tracking-[0.3em] text-white/45">
                  Register
                </p>

                <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold text-[#F5C84B]">
                  Create Account
                </h2>

                <p className="mt-4 text-white/65">
                  Enter your details below to open your TRI Shipping account.
                </p>
              </div>

              <form onSubmit={handleRegister} className="mt-10 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/70">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-[#F5C84B]/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/70">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-[#F5C84B]/60"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white/70">
                      Phone #
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPhone(e.target.value)
                      }
                      placeholder="Enter your phone number"
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-[#F5C84B]/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white/70">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Create a password"
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-[#F5C84B]/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/70">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Enter your address"
                    required
                    rows={4}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-[#F5C84B]/60"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Register"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/55 lg:text-left">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#F5C84B] hover:opacity-90"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
