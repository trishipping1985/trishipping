"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/packages", label: "Packages" },
  { href: "/dashboard/tracking", label: "Tracking" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else if (mounted) setEmail(data.user.email ?? "");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/login");
      else setEmail(session.user.email ?? "");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d24] via-[#050914] to-[#02040b]" />
        <div className="absolute left-1/2 top-[-220px] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="absolute right-[-280px] top-[200px] h-[640px] w-[640px] rounded-full bg-[#1b2559]/45 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64">
            <div className="rounded-3xl bg-white/6 ring-1 ring-white/12 p-5 backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#d4af37]/15 ring-1 ring-[#d4af37]/35 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#d4af37]">TRI</span>
                </div>
                <div className="leading-tight">
                  <div className="font-semibold">TRI Shipping</div>
                  <div className="text-xs text-white/50">Client Dashboard</div>
                </div>
              </Link>

              <div className="mt-5 space-y-2">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "block rounded-xl px-4 py-3 text-sm font-medium transition",
                        active
                          ? "bg-[#d4af37] text-[#050914]"
                          : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                <div className="text-xs text-white/50">Signed in as</div>
                <div className="mt-1 text-sm text-white/80 break-all">
                  {email || "…"}
                </div>

                <button
                  onClick={logout}
                  className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold
                             bg-white/5 text-white ring-1 ring-white/15
                             hover:bg-white/10 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1">
            <div className="rounded-3xl bg-white/6 ring-1 ring-white/12 p-6 backdrop-blur-sm">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
