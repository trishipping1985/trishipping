import Link from "next/link";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border border-[#1E2B52] bg-[#0A0F1F]/60 p-5 shadow-[0_0_0_1px_rgba(30,43,82,0.35),0_25px_60px_-35px_rgba(0,0,0,0.9)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2A3B6F] bg-[#0C1226] text-[#D6B15E] font-bold">
                TRI
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold">
                  <span className="text-[#D6B15E]">TRI</span> Shipping
                </div>
                <div className="text-xs text-white/60">Client Dashboard</div>
              </div>
            </div>

            <nav className="space-y-3">
              <Link
                href="/dashboard"
                className="block rounded-2xl bg-[#0D1326] px-4 py-3 text-sm font-semibold text-white/90 border border-[#1E2B52] hover:border-[#2A3B6F]"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/packages"
                className="block rounded-2xl bg-[#0D1326] px-4 py-3 text-sm font-semibold text-white/90 border border-[#1E2B52] hover:border-[#2A3B6F]"
              >
                Packages
              </Link>
              <Link
                href="/dashboard/tracking"
                className="block rounded-2xl bg-[#0D1326] px-4 py-3 text-sm font-semibold text-white/90 border border-[#1E2B52] hover:border-[#2A3B6F]"
              >
                Tracking
              </Link>
              <Link
                href="/dashboard/profile"
                className="block rounded-2xl bg-[#0D1326] px-4 py-3 text-sm font-semibold text-white/90 border border-[#1E2B52] hover:border-[#2A3B6F]"
              >
                Profile
              </Link>
            </nav>

            <div className="mt-7 rounded-2xl border border-[#1E2B52] bg-[#0B1022] p-4">
              <div className="text-xs text-white/55">Signed in as</div>
              <div className="mt-1 text-sm font-semibold">info@trishipping.com</div>

              {/* B: Admin button next to Logout */}
              <div className="mt-4 flex gap-2">
                <Link
                  href="/admin/packages"
                  className="flex-1 rounded-2xl border border-[#2A3B6F] bg-[#0D1326] px-4 py-3 text-center text-sm font-semibold text-white/90 hover:border-[#3A4E8E]"
                >
                  Admin
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="rounded-3xl border border-[#1E2B52] bg-[#0A0F1F]/35 p-6 shadow-[0_0_0_1px_rgba(30,43,82,0.25),0_25px_60px_-35px_rgba(0,0,0,0.9)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
