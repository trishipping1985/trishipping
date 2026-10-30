"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (active) {
        setLoggedIn(Boolean(data.session?.user));
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setLoggedIn(Boolean(session?.user));
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050914] pb-24 text-white md:pb-0">

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_20%),linear-gradient(180deg,#081020_0%,#050914_48%,#03060f_100%)]" />
        <div className="absolute left-1/2 top-[-170px] h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl sm:h-[420px] sm:w-[420px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 sm:pt-5">

        {/* HEADER */}
        <header className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
          <div className="flex items-center gap-4">

            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-xl">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping logo"
                width={64}
                height={64}
                className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="text-xl font-black tracking-tight text-[#d4af37] sm:text-2xl">
                TRI Shipping
              </div>
              <div className="text-[11px] text-white/55 sm:text-sm">
                Premium logistics and tracking
              </div>
            </div>

            <nav className="ml-auto hidden items-center gap-3 md:flex">

              <Link
                href="/pickup-requests"
                className="rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#050914] transition hover:bg-[#e6c55a]"
              >
                Request Pickup
              </Link>

              <Link
                href="/track"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Track
              </Link>

              {loggedIn ? (
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="mt-4 overflow-hidden rounded-[28px] border border-[#d4af37]/15 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-2xl sm:mt-6 sm:p-7 md:p-10">

          <div className="mx-auto max-w-3xl text-center">

            <div className="inline-flex rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
              Where Luxury Meets Logistics
            </div>

            <h1 className="mt-5 text-[30px] font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Worldwide Shipping.
              <span className="mt-2 block text-[#d4af37]">
                Premium Service.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Secure worldwide forwarding, shipment collection,
              professional handling, and real-time visibility
              throughout your shipping journey.
            </p>

            {/* MAIN PICKUP BUTTON */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href="/pickup-requests"
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#d4af37] px-8 py-4 text-base font-black uppercase tracking-wide text-[#050914] shadow-lg shadow-[#d4af37]/15 transition hover:-translate-y-0.5 hover:bg-[#e6c55a] sm:w-auto"
              >
                <span aria-hidden="true">🚚</span>
                Request Pickup
              </Link>

              <Link
                href="/track"
                className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10 sm:w-auto"
              >
                Track Shipment
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/45">
              Submit your collection request online.
              Our team will review and arrange your pickup.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2.5">
              <MetricCard value="24/7" label="Customer Service" />
              <MetricCard value="Secure" label="Handling" />
              <MetricCard value="Global" label="Shipping" />
            </div>
          </div>
        </section>

        {/* PICKUP SERVICE HIGHLIGHT */}
        <section className="mt-4 rounded-[28px] border border-[#d4af37]/25 bg-gradient-to-r from-[#101d36] to-[#152d51] p-6 shadow-xl sm:mt-6 sm:p-8">

          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
                TRI Shipping Collection Service
              </p>

              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Need a Shipment Picked Up?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Send your pickup request directly to TRI Shipping.
                Provide your sender, receiver, package details,
                and preferred collection date.
              </p>
            </div>

            <Link
              href="/pickup-requests"
              className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#d4af37] px-6 py-4 text-sm font-black uppercase tracking-wide text-[#050914] transition hover:bg-[#e6c55a] md:w-auto"
            >
              Schedule a Pickup
            </Link>
          </div>
        </section>

        {/* WHY CHOOSE TRI */}
        <section className="mt-4 rounded-[28px] border border-[#d4af37]/15 bg-white/[0.04] p-5 shadow-xl sm:mt-6 sm:p-7">

          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            Why Clients Choose TRI
          </p>

          <h2 className="mt-4 max-w-lg text-2xl font-black text-white sm:text-3xl">
            Built for Trust, Clarity, and Premium Service
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
            Transparent updates, professional handling,
            and a smoother logistics experience.
          </p>

          <div className="mt-5 space-y-3">
            <ReasonItem text="Transparent shipment tracking" />
            <ReasonItem text="Premium shipment handling" />
            <ReasonItem text="Fast access to shipment photos" />
            <ReasonItem text="Reliable shipment status updates" />
            <ReasonItem text="Convenient online pickup requests" />
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 md:grid-cols-3">

          <FeatureCard
            title="Handled With Care"
            desc="Processed with premium care from arrival to delivery."
          />

          <FeatureCard
            title="Global Forwarding"
            desc="Reliable international forwarding and collection services."
          />

          <FeatureCard
            title="Real-Time Tracking"
            desc="Clear shipment visibility and tracking updates."
          />
        </section>

        {/* FOOTER */}
        <footer className="px-2 pb-6 pt-8 text-center">
          <p className="text-sm font-black text-[#d4af37]">
            TRI SHIPPING
          </p>

          <p className="mt-2 text-xs text-white/50">
            Where Luxury Meets Logistics
          </p>

          <p className="mt-3 text-xs text-white/40">
            © {new Date().getFullYear()} TRI Shipping.
            All rights reserved.
          </p>
        </footer>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#081020]/95 backdrop-blur-xl md:hidden">
        <div
          className={`grid ${
            loggedIn ? "grid-cols-4" : "grid-cols-5"
          }`}
        >
          <BottomNavLink href="/" label="Home" />
          <BottomNavLink href="/pickup-requests" label="Pickup" />
          <BottomNavLink href="/track" label="Track" />

          {loggedIn ? (
            <BottomNavLink href="/dashboard" label="Dashboard" />
          ) : (
            <>
              <BottomNavLink href="/login" label="Login" />
              <BottomNavLink href="/register" label="Register" />
            </>
          )}
        </div>
      </nav>
    </main>
  );
}

function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-xl transition hover:border-[#d4af37]/25 hover:bg-white/[0.06] sm:p-6">
      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-white/65">
        {desc}
      </p>
    </div>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-4 text-center sm:px-5 sm:py-5">
      <div className="text-base font-black text-[#d4af37] sm:text-2xl">
        {value}
      </div>

      <div className="mt-2 text-[9px] font-bold uppercase tracking-wide text-white/45 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

function ReasonItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
      <div className="h-2 w-2 shrink-0 rounded-full bg-[#d4af37]" />

      <p className="text-sm text-white/75">
        {text}
      </p>
    </div>
  );
}

function BottomNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[64px] items-center justify-center px-1 text-center text-[10px] font-black uppercase tracking-wide text-white/80 transition hover:bg-white/5 hover:text-[#d4af37]"
    >
      {label}
    </Link>
  );
}