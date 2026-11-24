"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

type IconName =
  | "home"
  | "truck"
  | "search"
  | "box"
  | "user"
  | "camera"
  | "shield"
  | "customs"
  | "tax"
  | "calculator"
  | "arrow";

function Icon({
  name,
  size = 24,
}: {
  name: IconName;
  size?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v11H3z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    truck: (
      <>
        <path d="M2 4h13v13H2zM15 9h4l3 4v4h-7" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9" />
        <path d="m7.5 5.5 9 5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    camera: (
      <>
        <path d="M3 6h5l2-3h4l2 3h5v15H3z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    customs: (
      <>
        <path d="M5 3h14v18H5z" />
        <path d="M8 7h8M8 11h8" />
        <path d="m8 16 2 2 5-5" />
      </>
    ),
    tax: (
      <>
        <path d="m3 9 9-6 9 6v12H3z" />
        <path d="m8 17 8-8" />
        <circle cx="8" cy="9" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </>
    ),
    calculator: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2" />
      </>
    ),
    arrow: (
      <path d="M4 12h16M14 6l6 6-6 6" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function MobileHome() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRates, setShowRates] = useState(false);

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

  const accountHref = loggedIn
    ? "/dashboard"
    : "/login";

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[#031326] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom:
          "calc(90px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto max-w-lg">

        {/* OFFICIAL TRI SHIPPING HEADER */}

        <header className="flex items-center gap-3 px-4 py-4">

          <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">

            <Image
              src="/final-tri-logo.png"
              alt="Official TRI Shipping logo"
              width={62}
              height={62}
              className="h-full w-full object-contain"
              priority
            />

          </div>

          <div className="h-10 w-px shrink-0 bg-white/25" />

          <div className="min-w-0 flex-1">

            <h1 className="text-[20px] font-black leading-tight tracking-tight text-white">
              TRI SHIPPING
            </h1>

            <p className="mt-1 text-[8px] font-medium tracking-wide text-white/75">
              WHERE LUXURY MEETS LOGISTICS
            </p>

          </div>

          <Link
            href={accountHref}
            aria-label="My account"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#EAB942]/40 bg-white/5 text-[#FFC329]"
          >
            <Icon name="user" size={22} />
          </Link>

        </header>

        {/* PREMIUM CARGO HERO */}

        <section
          className="relative flex min-h-[210px] flex-col justify-center overflow-hidden px-5"
          style={{
            backgroundColor: "#092540",
            backgroundImage:
              "linear-gradient(90deg, rgba(3,19,38,.92) 0%, rgba(3,19,38,.55) 48%, rgba(3,19,38,.05) 100%), linear-gradient(0deg, #031326 0%, transparent 35%), url('/mobile/hero-cargo.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >

          <p className="text-[13px] font-medium text-white/85">
            {loggedIn
              ? "Welcome back"
              : "Welcome to TRI Shipping"}
          </p>

          <h2 className="mt-3 text-[32px] font-black leading-[1.1] tracking-tight">

            Where Luxury

            <span className="block italic text-[#FFC329]">
              Meets Logistics
            </span>

          </h2>

          <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-[#D49B15] to-[#FFD658]" />

          <p className="mt-3 max-w-[210px] text-[11px] leading-5 text-white/75">
            Premium shipping across borders.
          </p>

        </section>

        {/* SHIPPING BENEFITS */}

        <section className="grid grid-cols-4 divide-x divide-[#D4AF37]/25 px-3 pb-4 pt-2">

          <Benefit
            icon="shield"
            label="Fully Insured"
          />

          <Benefit
            icon="customs"
            label="Lebanon Customs Clearance"
          />

          <Benefit
            icon="tax"
            label="US Sales-Tax-Free Warehouse"
          />

          <Benefit
            icon="truck"
            label="Door-to-Door Delivery"
          />

        </section>

        <div className="px-4">

          {/* TRACK SHIPMENT */}

          <Link
            href="/track"
            className="flex items-center gap-3 rounded-[18px] border border-[#527BA7]/60 bg-gradient-to-r from-[#153D66] to-[#09233F] p-3 shadow-lg transition active:scale-[0.98]"
          >

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FFC329]">
              <Icon name="search" size={27} />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="text-[16px] font-bold">
                Track Your Shipment
              </h2>

              <p className="mt-1 text-[11px] text-white/65">
                Find your latest shipment update
              </p>

            </div>

            <Icon name="arrow" size={21} />

          </Link>

          {/* QUICK SERVICES */}

          <section className="mt-5">

            <h2 className="text-[20px] font-bold tracking-tight">
              Quick Services
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-3">

              <ServiceCard
                href="/pickup-requests"
                icon="truck"
                title="Request Pickup"
                description="Schedule collection"
                image="/mobile/pickup.jpg"
              />

              <ServiceCard
                href={accountHref}
                icon="box"
                title="My Shipments"
                description="Manage packages"
                image="/mobile/shipments.jpg"
              />

              <ServiceCard
                href={accountHref}
                icon="camera"
                title="Package Photos"
                description="View your photos"
                image="/mobile/warehouse.jpg"
              />

              <button
                type="button"
                onClick={() => setShowRates(true)}
                className="relative flex min-h-[114px] flex-col items-start justify-end overflow-hidden rounded-[17px] border border-[#527BA7]/60 bg-[#102D4A] p-3 text-left shadow-lg transition active:scale-95"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(3,19,38,.88), rgba(3,19,38,.28)), linear-gradient(0deg, rgba(3,19,38,.9), transparent), url('/mobile/air-freight.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >

                <div className="mb-2 text-[#FFC329]">
                  <Icon name="calculator" size={27} />
                </div>

                <h3 className="text-[13px] font-bold">
                  Shipping Rates
                </h3>

                <p className="mt-1 text-[10px] text-white/75">
                  Rate information
                </p>

              </button>

            </div>

          </section>

          {/* ACCOUNT ACCESS */}

          {!loggedIn ? (
            <section className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.04] p-4">

              <h2 className="text-base font-bold">
                Your shipping journey starts here.
              </h2>

              <p className="mt-2 text-xs leading-5 text-white/60">
                Create an account to manage your
                shipments and view package photos.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">

                <Link
                  href="/login"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-[#D4AF37]/40 text-sm font-bold text-[#FFC329]"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-[#FFC329] text-sm font-bold text-[#031326]"
                >
                  Register
                </Link>

              </div>

            </section>
          ) : (
            <Link
              href="/dashboard"
              className="mt-5 flex min-h-12 items-center justify-between rounded-xl border border-[#D4AF37]/30 bg-white/5 px-4 text-sm font-bold text-[#FFC329]"
            >
              Open My Dashboard
              <Icon name="arrow" size={20} />
            </Link>
          )}

          <footer className="pb-4 pt-6 text-center">

            <p className="text-[9px] tracking-widest text-[#D4AF37]/75">
              WHERE LUXURY MEETS LOGISTICS
            </p>

          </footer>

        </div>

      </div>

      {/* RATES PREVIEW */}

      {showRates && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          onClick={() => setShowRates(false)}
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="rates-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-[24px] border border-[#D4AF37]/30 bg-[#10243D] p-6 shadow-2xl"
          >

            <div className="text-[#FFC329]">
              <Icon name="calculator" size={32} />
            </div>

            <h2
              id="rates-title"
              className="mt-4 text-xl font-bold"
            >
              Shipping Rates
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Shipping rates depend on the origin,
              destination, package weight and product
              category.
            </p>

            <p className="mt-3 text-xs text-white/50">
              The dedicated rate service is not
              connected in this development preview.
            </p>

            <button
              type="button"
              onClick={() => setShowRates(false)}
              className="mt-5 min-h-12 w-full rounded-xl bg-[#FFC329] text-sm font-bold text-[#031326]"
            >
              Close
            </button>

          </section>

        </div>
      )}

      {/* NATIVE-STYLE BOTTOM NAVIGATION */}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-[#527BA7]/50 bg-[#04182F]/95 shadow-2xl backdrop-blur-xl"
        style={{
          paddingBottom:
            "env(safe-area-inset-bottom, 0px)",
        }}
      >

        <div className="mx-auto grid max-w-lg grid-cols-5 px-2">

          <NavItem
            href="/mobile"
            icon="home"
            label="Home"
            active
          />

          <NavItem
            href="/pickup-requests"
            icon="truck"
            label="Pickup"
          />

          <NavItem
            href="/track"
            icon="search"
            label="Track"
          />

          <NavItem
            href={accountHref}
            icon="box"
            label="Packages"
          />

          <NavItem
            href={accountHref}
            icon="user"
            label="Account"
          />

        </div>

      </nav>

    </main>
  );
}

function Benefit({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-1.5 text-center">

      <div className="text-[#FFC329]">
        <Icon name={icon} size={25} />
      </div>

      <span className="text-[10px] font-semibold leading-[13px] text-white/90">
        {label}
      </span>

    </div>
  );
}

function ServiceCard({
  href,
  icon,
  title,
  description,
  image,
}: {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  image: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-[114px] flex-col items-start justify-end overflow-hidden rounded-[17px] border border-[#527BA7]/60 bg-[#102D4A] p-3 shadow-lg transition active:scale-95"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(3,19,38,.88), rgba(3,19,38,.28)), linear-gradient(0deg, rgba(3,19,38,.9), transparent), url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      <div className="mb-2 text-[#FFC329]">
        <Icon name={icon} size={27} />
      </div>

      <h3 className="text-[13px] font-bold">
        {title}
      </h3>

      <p className="mt-1 text-[10px] text-white/75">
        {description}
      </p>

    </Link>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[72px] flex-col items-center justify-center gap-2 ${
        active
          ? "text-[#FFC329]"
          : "text-white/80"
      }`}
    >

      <Icon name={icon} size={25} />

      <span className="text-[10px] font-semibold">
        {label}
      </span>

      {active && (
        <div className="absolute bottom-1 h-[3px] w-8 rounded-full bg-[#FFC329] shadow-[0_0_10px_#FFC329]" />
      )}

    </Link>
  );
}