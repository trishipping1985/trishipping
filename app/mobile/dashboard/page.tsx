"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import PushNotificationsButton from "@/components/PushNotificationsButton";
import { supabase } from "@/lib/supabaseClient";

type PackageRow = {
  id: string;
  tracking_code: string | null;
  status: string | null;
  created_at: string | null;
};

type IconName =
  | "home"
  | "truck"
  | "search"
  | "box"
  | "user"
  | "camera"
  | "receipt"
  | "bell"
  | "arrow"
  | "refresh"
  | "check";

const STATUS_CARDS = [
  {
    status: "RECEIVED",
    title: "Received",
    subtitle: "Warehouse check-in",
    image: "/mobile/dashboard/icons/received.png",
    color: "#F5C84B",
  },
  {
    status: "SHIPPED",
    title: "Shipped",
    subtitle: "Dispatched",
    image: "/mobile/dashboard/icons/shipped.png",
    color: "#A5B4FC",
  },
  {
    status: "IN TRANSIT",
    title: "In Transit",
    subtitle: "On the move",
    image: "/mobile/dashboard/icons/in-transit.png",
    color: "#7DD3FC",
  },
  {
    status: "OUT FOR DELIVERY",
    title: "Out for Delivery",
    subtitle: "Final delivery route",
    image: "/mobile/dashboard/icons/out-for-delivery.png",
    color: "#FDBA74",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    subtitle: "Successfully delivered",
    image: "/mobile/dashboard/icons/delivered.png",
    color: "#6EE7B7",
  },
];

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
}

function getStatusColor(status: string | null) {
  return (
    STATUS_CARDS.find(
      (item) => item.status === normalizeStatus(status)
    )?.color || "#CBD5E1"
  );
}

function Icon({
  name,
  size = 24,
}: {
  name: IconName;
  size?: number;
}) {
  const icons: Record<IconName, ReactNode> = {
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
    receipt: (
      <>
        <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5 9a8 8 0 0 1 13-4l2 3M4 16l2 3a8 8 0 0 0 13-4" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
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
      {icons[name]}
    </svg>
  );
}

export default function MobileDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [fullName, setFullName] = useState("Customer");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setNeedsAuth(false);
        setPackages([]);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (active) {
            setNeedsAuth(true);
            setLoading(false);
          }
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("users")
            .select("id, full_name, email")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        const displayName =
          profile?.full_name?.trim() || "Customer";

        const allRows: PackageRow[] = [];
        const pageSize = 500;

        for (let offset = 0; ; offset += pageSize) {
          const { data, error: packageError } =
            await supabase
              .from("packages")
              .select("id, tracking_code, status, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
              .range(offset, offset + pageSize - 1);

          if (packageError) throw packageError;
          if (!active) return;

          const rows = (data || []) as PackageRow[];

          allRows.push(...rows);

          if (rows.length < pageSize) break;
        }

        if (active) {
          setFullName(displayName);
          setPackages(allRows);
          setLoading(false);
        }
      } catch (err) {
        console.error("Mobile dashboard error:", err);

        if (active) {
          setPackages([]);
          setError(
            "Unable to load your shipments. Please try again."
          );
          setLoading(false);
        }
      }
    }

    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        active = false;
        setPackages([]);
        setFullName("Customer");
        setNeedsAuth(true);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshKey]);

  const totalPackages = packages.length;

  const deliveredCount = packages.filter(
    (pkg) => normalizeStatus(pkg.status) === "DELIVERED"
  ).length;

  const activeCount = packages.filter((pkg) =>
    [
      "RECEIVED",
      "SHIPPED",
      "IN TRANSIT",
      "OUT FOR DELIVERY",
    ].includes(normalizeStatus(pkg.status))
  ).length;

  const statusCounts = useMemo(() => {
    return Object.fromEntries(
      STATUS_CARDS.map((item) => [
        item.status,
        packages.filter(
          (pkg) => normalizeStatus(pkg.status) === item.status
        ).length,
      ])
    );
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return packages.filter((pkg) => {
      const status = normalizeStatus(pkg.status);

      const matchesStatus =
        selectedStatus === "ALL" ||
        selectedStatus === status;

      const matchesSearch =
        !query ||
        String(pkg.tracking_code || "")
          .toLowerCase()
          .includes(query) ||
        status.toLowerCase().includes(query) ||
        pkg.id.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [packages, selectedStatus, searchTerm]);

  const visiblePackages =
    showAll || selectedStatus !== "ALL" || searchTerm.trim()
      ? filteredPackages
      : filteredPackages.slice(0, 5);

  function selectStatus(status: string) {
    setSelectedStatus(status);
    setShowAll(false);

    requestAnimationFrame(() => {
      document
        .getElementById("shipment-list")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  const firstName =
    fullName.trim().split(" ")[0] || "Customer";

  if (needsAuth) {
    return (
      <main className="min-h-[100dvh] bg-[#031326] p-5 text-white">
        <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-[#10243D] p-6 text-center">
          <Image
            src="/final-tri-logo.png"
            alt="Official TRI Shipping logo"
            width={90}
            height={90}
            className="mx-auto rounded-2xl bg-white"
            priority
          />

          <h1 className="mt-5 text-2xl font-black">
            Welcome to TRI Shipping
          </h1>

          <p className="mt-3 text-sm text-white/65">
            Sign in to securely access your shipments.
          </p>

          <Link
            href="/login"
            className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#FFC329] font-bold text-[#031326]"
          >
            Sign In
          </Link>

          <Link
            href="/mobile"
            className="mt-3 block py-3 text-sm text-[#FFC329]"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(ellipse_at_top_right,#123659_0%,#061a30_35%,#031326_75%)] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom:
          "calc(95px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 pt-4">

        {/* OFFICIAL TRI SHIPPING HEADER */}

        <header className="flex items-center gap-3 pb-1">
          <Image
            src="/final-tri-logo.png"
            alt="Official TRI Shipping logo"
            width={54}
            height={54}
            className="h-[54px] w-[54px] shrink-0 rounded-2xl bg-white object-contain shadow-lg"
            priority
          />

          <div className="h-9 w-px bg-white/20" />

          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-black tracking-tight sm:text-2xl">
              TRI SHIPPING
            </div>

            <p className="mt-1 text-[8px] font-semibold tracking-wide text-[#F5C84B] sm:text-[10px]">
              WHERE LUXURY MEETS LOGISTICS
            </p>
          </div>

          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FFC329]/40 bg-white/5 text-[#FFC329]"
          >
            <Icon name="bell" size={21} />
          </Link>
        </header>

        {/* COMPACT PREMIUM HERO BANNER */}

<section className="relative mt-4 overflow-hidden rounded-[22px] border border-[#527BA7]/40 bg-[#081B30] shadow-xl">

  <Image
    src="/mobile/dashboard/hero.jpg"
    alt="TRI Shipping logistics"
    width={1728}
    height={864}
    sizes="(max-width: 640px) 100vw, 576px"
    className="block h-auto w-full object-contain"
    priority
  />

  <div className="absolute inset-0 bg-gradient-to-t from-[#031326]/65 via-transparent to-transparent" />

  <div className="absolute bottom-[44%] left-0 rounded-r-2xl bg-gradient-to-r from-[#031326]/85 to-transparent px-4 py-2 sm:px-5">

    <p className="text-base font-extrabold text-white sm:text-xl [text-shadow:0_2px_6px_#000]">
      Welcome back,
    </p>

    <h1 className="mt-0.5 text-3xl font-black leading-none text-[#FFC329] sm:text-5xl [text-shadow:0_3px_8px_#000]">
      {loading ? "Customer" : firstName}
    </h1>

  </div>

  <div className="absolute inset-x-0 bottom-2 grid grid-cols-3 gap-2 bg-transparent px-2 [text-shadow:0_2px_6px_#000]">

    <OverviewCard
      label="Total"
      icon="box"
      color="#FFC329"
      value={loading || error ? "-" : totalPackages}
      onClick={() => selectStatus("ALL")}
    />

    <OverviewCard
      label="Active"
      icon="truck"
      color="#7DD3FC"
      value={loading || error ? "-" : activeCount}
    />

    <OverviewCard
      label="Delivered"
      icon="check"
      color="#6EE7B7"
      value={loading || error ? "-" : deliveredCount}
      onClick={() => selectStatus("DELIVERED")}
    />

  </div>

  <div className="absolute inset-x-8 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#FFC329] to-transparent" />

</section>

{/* ERROR HANDLING */}

        {error && (
          <section className="mt-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4">

            <p className="text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="mt-3 text-sm font-bold text-[#FFC329]"
            >
              Try again
            </button>

          </section>
        )}

        {/* SHIPMENT UPDATES */}

        <section className="mt-5">

          <div className="mb-3 flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="h-9 w-[3px] rounded-full bg-[#FFC329] shadow-[0_0_10px_rgba(255,195,41,.45)]" />

              <div>
                <h2 className="text-xl font-black tracking-tight">
                  Shipment Updates
                </h2>

                <p className="mt-1 text-[11px] text-white/55">
                  Tap a status to view packages.
                </p>
              </div>

            </div>

            <button
              type="button"
              aria-label="Refresh shipments"
              disabled={loading}
              onClick={() => setRefreshKey((value) => value + 1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FFC329]/25 bg-[#10243D] text-[#FFC329] disabled:opacity-50"
            >
              <Icon name="refresh" size={21} />
            </button>

          </div>

          {/* FIVE TRANSPARENT BRANDED ILLUSTRATIONS */}

          <div className="grid grid-cols-5 gap-1.5 pb-2 pt-1 sm:gap-2">

            {STATUS_CARDS.map((item) => (
              <StatusCard
                key={item.status}
                item={item}
                count={
                  loading || error
                    ? "-"
                    : statusCounts[item.status] || 0
                }
                selected={selectedStatus === item.status}
                onClick={() => selectStatus(item.status)}
              />
            ))}

          </div>

        </section>

        {/* QUICK ACCESS */}

        <section className="mt-6">

          <h2 className="text-lg font-black">
            Quick Access
          </h2>

          <div className="mt-3 grid grid-cols-4 gap-2">

            <QuickAction
              href="/dashboard/tracking"
              icon="search"
              label="Tracking"
            />

            <QuickAction
              href="/dashboard/receipts"
              icon="receipt"
              label="Receipts"
            />

            <QuickAction
              href="/dashboard/package-photos"
              icon="camera"
              label="Photos"
            />

            <QuickAction
              href="/dashboard/notifications"
              icon="bell"
              label="Updates"
            />

          </div>

        </section>

        {/* SEARCH AND FILTERED SHIPMENTS */}

        <section
          id="shipment-list"
          className="mt-6 scroll-mt-4 rounded-[22px] border border-white/10 bg-[#0C2037] p-4"
        >

          <div className="flex items-center justify-between gap-2">

            <h2 className="text-lg font-black">
              {selectedStatus === "ALL"
                ? "Recent Shipments"
                : STATUS_CARDS.find(
                    (item) => item.status === selectedStatus
                  )?.title || selectedStatus}
            </h2>

            <button
              type="button"
              onClick={() => {
                setSelectedStatus("ALL");
                setSearchTerm("");
                setShowAll(true);
              }}
              className="shrink-0 text-xs font-bold text-[#FFC329]"
            >
              View All
            </button>

          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">

            <span className="text-[#FFC329]">
              <Icon name="search" size={18} />
            </span>

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search tracking code"
              aria-label="Search shipments"
              className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />

          </div>

          {selectedStatus !== "ALL" && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("ALL");
                setShowAll(false);
              }}
              className="mt-3 rounded-lg border border-[#FFC329]/25 bg-[#FFC329]/10 px-3 py-2 text-xs font-bold text-[#FFC329]"
            >
              Clear Filter
            </button>
          )}

          <div className="mt-3 space-y-3">

            {loading ? (
              <p className="py-6 text-center text-sm text-white/55">
                Loading shipments...
              </p>
            ) : error ? (
              <p className="py-6 text-center text-sm text-white/55">
                Shipment information is unavailable.
              </p>
            ) : visiblePackages.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/55">
                No matching shipments found.
              </p>
            ) : (
              visiblePackages.map((pkg) => (
                <ShipmentCard key={pkg.id} pkg={pkg} />
              ))
            )}

          </div>

          {!loading &&
            !error &&
            visiblePackages.length < filteredPackages.length && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#FFC329]/25 text-sm font-bold text-[#FFC329]"
              >
                Show More Shipments
              </button>
            )}

        </section>

        {/* PUSH NOTIFICATIONS */}

        <section className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <PushNotificationsButton />
        </section>

        {/* TRI SHIPPING FOOTER */}

        <footer className="pb-5 pt-6 text-center">

          <p className="text-xs font-black tracking-widest text-[#FFC329]">
            TRI SHIPPING
          </p>

          <p className="mt-2 text-[9px] tracking-widest text-white/55">
            WHERE LUXURY MEETS LOGISTICS
          </p>

        </footer>

      </div>

      {/* FIXED MOBILE BOTTOM NAVIGATION */}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-[#527BA7]/50 bg-[#04182F]/95 shadow-2xl backdrop-blur-xl"
        style={{
          paddingBottom:
            "env(safe-area-inset-bottom, 0px)",
        }}
      >

        <div className="mx-auto grid max-w-xl grid-cols-5 px-2">

          <NavItem
            href="/mobile"
            icon="home"
            label="Home"
          />

          <NavItem
            href="/pickup-requests"
            icon="truck"
            label="Pickup"
          />

          <NavItem
            href="/dashboard/tracking"
            icon="search"
            label="Track"
          />

          <NavItem
            href="/mobile/dashboard"
            icon="box"
            label="Packages"
            active
          />

          <NavItem
            href="/dashboard/profile"
            icon="user"
            label="Account"
          />

        </div>

      </nav>

    </main>
  );
}

/* PREMIUM TRANSPARENT SHIPMENT CARDS */

function StatusCard({
  item,
  count,
  selected,
  onClick,
}: {
  item: (typeof STATUS_CARDS)[number];
  count: string | number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${item.title}: ${count} shipments`}
      onClick={onClick}
      className="group relative flex h-[112px] w-full min-w-0 sm:h-[142px] flex-col items-center justify-between overflow-hidden rounded-2xl border bg-[radial-gradient(ellipse_at_top,#1B3C5C_0%,#102A45_48%,#091C31_100%)] px-0.5 py-2 text-center transition active:scale-95 sm:px-2"
      style={{
        borderColor: selected
          ? "#FFC329"
          : `${item.color}55`,
        boxShadow: selected
          ? "inset 0 0 12px rgba(255,195,41,.25)"
          : "0 4px 12px rgba(0,0,0,.2)",
      }}
    >
      <div className="relative h-[38px] w-full shrink-0 sm:h-[58px]">
        <Image
          src={item.image}
          alt={`TRI Shipping ${item.title}`}
          fill
          sizes="120px"
          className="object-contain drop-shadow-md transition duration-300 group-hover:scale-105"
        />
      </div>

      <h3 className="flex min-h-[28px] items-center justify-center text-[9px] sm:text-[11px] font-black leading-tight text-white">
        {item.title}
      </h3>

      <span
        className="text-3xl font-black leading-none tabular-nums"
        style={{
          color: item.color,
          textShadow: `0 0 10px ${item.color}30`,
        }}
      >
        {count}
      </span>

      <div
        className="h-[3px] w-7 shrink-0 rounded-full"
        style={{
          backgroundColor: item.color,
          boxShadow: `0 0 8px ${item.color}55`,
        }}
      />
    </button>
  );
}

function OverviewCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  color: string;
  onClick?: () => void;
}) {
  const content = (
    <>

      <div style={{ color }}>
        <Icon name={icon} size={20} />
      </div>

      <div className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
        {label}
      </div>

      <div
        className="mt-0.5 text-3xl font-black leading-none tabular-nums sm:text-4xl"
        style={{ color }}
      >
        {value}
      </div>

    </>
  );

  const classes =
    "flex min-w-0 flex-col items-center justify-center rounded-xl border border-white/20 bg-[#031326]/65 px-1 py-1 text-center [text-shadow:0_2px_5px_#000]";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}

/* QUICK ACCESS BUTTONS */

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[#527BA7]/30 bg-gradient-to-br from-[#183C5D] to-[#0B2239] px-1 py-4 text-center shadow-lg transition active:scale-95"
    >

      <span className="text-[#FFC329]">
        <Icon name={icon} size={24} />
      </span>

      <span className="text-[10px] font-semibold">
        {label}
      </span>

    </Link>
  );
}

/* INDIVIDUAL SHIPMENT TRACKING CARD */

function ShipmentCard({ pkg }: { pkg: PackageRow }) {
  const status = normalizeStatus(pkg.status);
  const color = getStatusColor(pkg.status);

  const statusIndex = STATUS_CARDS.findIndex(
    (item) => item.status === status
  );

  const trackingHref = pkg.tracking_code
    ? `/dashboard/tracking?tracking=${encodeURIComponent(
        pkg.tracking_code
      )}`
    : "/dashboard/tracking";

  return (
    <article className="rounded-2xl border border-white/10 bg-[#031326]/65 p-3">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <div className="min-w-0">

          <h3 className="break-all text-sm font-black text-[#FFC329]">
            {pkg.tracking_code || "No tracking code"}
          </h3>

          <p className="mt-1 text-[10px] text-white/50">
            Created: {formatDate(pkg.created_at)}
          </p>

        </div>

        <span
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold"
          style={{ color }}
        >
          {status || "UNKNOWN"}
        </span>

      </div>

      {statusIndex >= 0 && (
        <div className="mt-4">

          <div className="grid grid-cols-5 gap-1">

            {STATUS_CARDS.map((item, index) => (
              <div
                key={item.status}
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    index <= statusIndex
                      ? "#FFC329"
                      : "#263B52",
                }}
              />
            ))}

          </div>

          <div className="mt-2 flex justify-between text-[9px] text-white/45">

            <span>Received</span>
            <span>Delivered</span>

          </div>

        </div>
      )}

      <Link
        href={trackingHref}
        className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-[#FFC329]"
      >
        View Tracking Details
        <Icon name="arrow" size={16} />
      </Link>

    </article>
  );
}

/* MOBILE NAVIGATION ITEMS */

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
      className={`relative flex min-h-[68px] flex-col items-center justify-center gap-2 ${
        active
          ? "text-[#FFC329]"
          : "text-white/80"
      }`}
    >

      <Icon name={icon} size={24} />

      <span className="text-[10px] font-semibold">
        {label}
      </span>

      {active && (
        <div className="absolute bottom-1 h-[3px] w-8 rounded-full bg-[#FFC329] shadow-[0_0_10px_#FFC329]" />
      )}

    </Link>
  );
}







