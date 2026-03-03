"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }: { children: ReactNode }) {

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          
          {/* Sidebar */}
          <aside className="rounded-3xl border border-[#1E2B52] bg-[#0A0F1F]/60 p-5">
            
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2A3B6F] bg-[#0C1226] text-[#D6B15E] font-bold">
                TRI
              </div>
              <div>
                <div className="text-lg font-semibold">
                  <span className="text-[#D6B15E]">TRI</span> Shipping
                </div>
                <div className="text-xs text-white/60">Client Dashboard</div>
              </div>
            </div>

            <nav className="space-y-3">
              <Link href="/dashboard" className="block px-4 py-3 rounded-xl bg-[#0D1326]">
                Overview
              </Link>

              <Link href="/dashboard/packages" className="block px-4 py-3 rounded-xl bg-[#0D1326]">
                Packages
              </Link>

              <Link href="/dashboard/tracking" className="block px-4 py-3 rounded-xl bg-[#0D1326]">
                Tracking
              </Link>

              <Link href="/dashboard/profile" className="block px-4 py-3 rounded-xl bg-[#0D1326]">
                Profile
              </Link>
            </nav>

            <div className="mt-6 space-y-3">
              
              <div className="flex gap-2">
                <Link
                  href="/admin/packages"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0D1326] text-center"
                >
                  Admin
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="rounded-3xl border border-[#1E2B52] bg-[#0A0F1F]/35 p-6">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
