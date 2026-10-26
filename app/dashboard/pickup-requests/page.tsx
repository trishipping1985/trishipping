"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PickupStatus =
  | "pending"
  | "approved"
  | "scheduled"
  | "picked_up"
  | "cancelled";

type Pickup = {
  id: number;
  customer_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_country: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_country: string;
  package_description: string | null;
  package_count: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  requested_pickup_date: string | null;
  notes: string | null;
  status: PickupStatus;
  created_at: string;
};

const statuses: PickupStatus[] = [
  "pending",
  "approved",
  "scheduled",
  "picked_up",
  "cancelled",
];

const labels: Record<PickupStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  scheduled: "Scheduled",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
};

const colors: Record<PickupStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-blue-500/15 text-blue-300",
  scheduled: "bg-purple-500/15 text-purple-300",
  picked_up: "bg-green-500/15 text-green-300",
  cancelled: "bg-red-500/15 text-red-300",
};

function reference(id: number) {
  return `TRI-PU-${String(id).padStart(6, "0")}`;
}

function display(value: string | number | null) {
  return value === null || value === ""
    ? "Not provided"
    : String(value);
}

export default function PickupAdminPage() {
  const router = useRouter();

  const [access, setAccess] = useState<
    "checking" | "allowed" | "denied"
  >("checking");

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [drafts, setDrafts] = useState<Record<number, PickupStatus>>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPickups() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("pickup_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const records = (data || []) as Pickup[];
      setPickups(records);

      const nextDrafts: Record<number, PickupStatus> = {};

      records.forEach((item) => {
        nextDrafts[item.id] = item.status;
      });

      setDrafts(nextDrafts);
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      const { data: isAdmin, error: roleError } =
        await supabase.rpc("pickup_admin_access");

      if (!active) return;

      if (roleError) {
        setError(roleError.message);
        setAccess("denied");
        return;
      }

      if (isAdmin !== true) {
        setAccess("denied");
        return;
      }

      setAccess("allowed");
      await loadPickups();
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  async function updateStatus(item: Pickup) {
    const newStatus = drafts[item.id];

    if (!newStatus || newStatus === item.status) return;

    setSavingId(item.id);
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("pickup_requests")
      .update({ status: newStatus })
      .eq("id", item.id)
      .select("id, status")
      .single();

    if (updateError || !data) {
      setError(updateError?.message || "Unable to update request.");
    } else {
      setPickups((previous) =>
        previous.map((row) =>
          row.id === item.id
            ? { ...row, status: data.status as PickupStatus }
            : row
        )
      );

      setMessage(
        `${reference(item.id)} updated to ${labels[newStatus]}.`
      );
    }

    setSavingId(null);
  }

  const filteredPickups = pickups.filter((item) => {
    const matchesStatus =
      filter === "all" || item.status === filter;

    const query = search.trim().toLowerCase();

    const searchableText = [
      reference(item.id),
      item.sender_name,
      item.sender_phone,
      item.receiver_name,
      item.receiver_phone,
      item.sender_country,
      item.receiver_country,
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesStatus &&
      (!query || searchableText.includes(query))
    );
  });

  if (access === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        Checking administrator access...
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-[#101E35] p-8 text-white">
        <h1 className="text-2xl font-bold text-red-300">
          Administrator Access Required
        </h1>

        <p className="mt-4 text-sm text-slate-300">
          Only authorized TRI Shipping administrators can manage
          pickup requests.
        </p>

        {error && (
          <p className="mt-4 break-words text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      {/* HEADER */}
      <div className="rounded-2xl border border-[#F5C84B]/20 bg-gradient-to-r from-[#071427] to-[#143566] p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#F5C84B]">
          TRI SHIPPING ADMINISTRATION
        </p>

        <h1 className="mt-3 text-3xl font-black">
          Pickup Requests
        </h1>

        <p className="mt-3 text-sm text-slate-300">
          Manage pickup requests, review shipment details,
          and update collection statuses.
        </p>

        <button
          type="button"
          onClick={loadPickups}
          disabled={loading}
          className="mt-5 rounded-xl bg-[#F5C84B] px-5 py-3 text-sm font-bold text-[#071427] hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Requests"}
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statuses.map((status) => (
          <div
            key={status}
            className="rounded-2xl border border-white/10 bg-[#101E35] p-4"
          >
            <p className="text-xs text-slate-400">
              {labels[status]}
            </p>

            <p className="mt-2 text-3xl font-bold text-[#F5C84B]">
              {
                pickups.filter(
                  (item) => item.status === status
                ).length
              }
            </p>
          </div>
        ))}
      </div>

      {/* MESSAGES */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* SEARCH */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#101E35] p-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Search Requests
          </span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Reference, sender, receiver, phone..."
            className="w-full rounded-xl border border-white/15 bg-[#071427] px-4 py-3 text-sm text-white outline-none focus:border-[#F5C84B]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Filter by Status
          </span>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#071427] px-4 py-3 text-sm text-white outline-none focus:border-[#F5C84B]"
          >
            <option value="all">All Requests</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* REQUEST LIST */}
      {filteredPickups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#101E35] p-10 text-center text-slate-300">
          {loading
            ? "Loading pickup requests..."
            : "No pickup requests found."}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredPickups.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#101E35] shadow-xl"
            >
              {/* REQUEST HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                <div>
                  <p className="text-lg font-black text-[#F5C84B]">
                    {reference(item.id)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Submitted{" "}
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${colors[item.status]}`}
                >
                  {labels[item.status]}
                </span>
              </div>

              {/* SENDER AND RECEIVER */}
              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <section className="rounded-xl bg-[#071427] p-5">
                  <h2 className="mb-4 font-bold text-[#F5C84B]">
                    Sender / Pickup
                  </h2>

                  <div className="space-y-2 text-sm text-slate-300">
                    <p><strong>Name:</strong> {item.sender_name}</p>
                    <p><strong>Phone:</strong> {item.sender_phone}</p>
                    <p><strong>Address:</strong> {item.sender_address}</p>
                    <p><strong>Country:</strong> {item.sender_country}</p>
                  </div>
                </section>

                <section className="rounded-xl bg-[#071427] p-5">
                  <h2 className="mb-4 font-bold text-[#F5C84B]">
                    Receiver / Delivery
                  </h2>

                  <div className="space-y-2 text-sm text-slate-300">
                    <p><strong>Name:</strong> {item.receiver_name}</p>
                    <p><strong>Phone:</strong> {item.receiver_phone}</p>
                    <p><strong>Address:</strong> {item.receiver_address}</p>
                    <p><strong>Country:</strong> {item.receiver_country}</p>
                  </div>
                </section>
              </div>

              {/* PACKAGE DETAILS */}
              <div className="border-t border-white/10 px-5 py-5">
                <h2 className="mb-4 font-bold text-[#F5C84B]">
                  Shipment Information
                </h2>

                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <p>
                    <strong>Contents:</strong>{" "}
                    {display(item.package_description)}
                  </p>

                  <p>
                    <strong>Packages:</strong>{" "}
                    {item.package_count}
                  </p>

                  <p>
                    <strong>Weight:</strong>{" "}
                    {display(item.weight_kg)} KG
                  </p>

                  <p>
                    <strong>Dimensions:</strong>{" "}
                    {display(item.length_cm)} ×{" "}
                    {display(item.width_cm)} ×{" "}
                    {display(item.height_cm)} CM
                  </p>

                  <p>
                    <strong>Requested Pickup:</strong>{" "}
                    {display(item.requested_pickup_date)}
                  </p>

                  <p>
                    <strong>Customer ID:</strong>{" "}
                    <span className="break-all">
                      {item.customer_id}
                    </span>
                  </p>
                </div>

                {item.notes && (
                  <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-slate-300">
                    <strong>Instructions:</strong>{" "}
                    {item.notes}
                  </div>
                )}
              </div>

              {/* STATUS MANAGEMENT */}
              <div className="border-t border-white/10 bg-[#071427] p-5">
                <h2 className="mb-3 font-bold text-white">
                  Manage Pickup Status
                </h2>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    aria-label={`Status for ${reference(item.id)}`}
                    value={drafts[item.id] || item.status}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [item.id]:
                          event.target.value as PickupStatus,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#101E35] px-4 py-3 text-sm text-white"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {labels[status]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => updateStatus(item)}
                    disabled={
                      savingId !== null ||
                      (drafts[item.id] || item.status) === item.status
                    }
                    className="rounded-xl bg-[#F5C84B] px-6 py-3 text-sm font-bold text-[#071427] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingId === item.id
                      ? "Saving..."
                      : "Update Status"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}