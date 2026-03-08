"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default function AddPackagePage() {
  const router = useRouter();

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [trackingCode, setTrackingCode] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function makeTrackingCode() {
    const random = Math.floor(100 + Math.random() * 900);
    setTrackingCode(`TRI-${random}`);
  }

  useEffect(() => {
    let active = true;

    async function runSearch() {
      const q = customerQuery.trim();

      if (!q || selectedCustomer) {
        if (active) setCustomers([]);
        return;
      }

      setLoadingCustomers(true);

      try {
        const res = await fetch(
          `/api/customers/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!active) return;

        if (Array.isArray(data)) {
          setCustomers(data);
        } else if (Array.isArray(data?.data)) {
          setCustomers(data.data);
        } else {
          setCustomers([]);
        }
      } catch {
        if (active) setCustomers([]);
      } finally {
        if (active) setLoadingCustomers(false);
      }
    }

    const timer = setTimeout(runSearch, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery, selectedCustomer]);

  const selectedLabel = useMemo(() => {
    if (!selectedCustomer) return "";
    return (
      selectedCustomer.full_name ||
      selectedCustomer.email ||
      selectedCustomer.id
    );
  }, [selectedCustomer]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanTrackingCode = trackingCode.trim().toUpperCase();
    const cleanNotes = notes.trim();
    const cleanWeight = weight.trim();

    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

    if (!cleanTrackingCode) {
      setError("Tracking code is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/packages/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedCustomer.id,
          tracking_code: cleanTrackingCode,
          status,
          notes: cleanNotes,
          weight_kg: cleanWeight,
        }),
      });

      const data = await res.json();

      setSaving(false);

      if (!res.ok) {
        setError(data?.error || "Failed to create package");
        return;
      }

      setSuccess("Package added successfully");
      setCustomerQuery("");
      setCustomers([]);
      setSelectedCustomer(null);
      setTrackingCode("");
      setStatus("RECEIVED");
      setNotes("");
      setWeight("");

      setTimeout(() => {
        router.push("/dashboard/packages");
      }, 1200);
    } catch {
      setSaving(false);
      setError("Failed to create package");
    }
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Admin Package Creation
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Add Box
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Create a new shipment and assign its first tracking details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Customer Search
            </label>

            <input
              value={customerQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCustomerQuery(e.target.value);
                setSelectedCustomer(null);
              }}
              placeholder="Search customer by name or email"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />

            {loadingCustomers ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                Searching...
              </div>
            ) : null}

            {!loadingCustomers &&
            customerQuery.trim() &&
            !selectedCustomer &&
            customers.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerQuery(
                        customer.full_name || customer.email || customer.id
                      );
                      setCustomers([]);
                    }}
                    className="block w-full border-b border-white/10 px-4 py-4 text-left transition last:border-b-0 hover:bg-white/5"
                  >
                    <div className="font-semibold text-white">
                      {customer.full_name || "No name"}
                    </div>
                    <div className="text-sm text-white/60">
                      {customer.email || "No email"}
                    </div>
                    <div className="mt-1 text-xs text-white/35">
                      {customer.id}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {!loadingCustomers &&
            customerQuery.trim() &&
            !selectedCustomer &&
            customers.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                No customers found
              </div>
            ) : null}

            {selectedCustomer ? (
              <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4">
                <div className="text-sm text-emerald-300">Selected customer</div>
                <div className="mt-1 font-semibold text-white">{selectedLabel}</div>
                <div className="text-sm text-white/60">
                  {selectedCustomer.email || "No email"}
                </div>
                <div className="mt-1 text-xs text-white/35">
                  user_id: {selectedCustomer.id}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Tracking Code
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={trackingCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTrackingCode(e.target.value.toUpperCase())
                }
                placeholder="TRI-001"
                className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
              />
              <button
                type="button"
                onClick={makeTrackingCode}
                className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 font-bold text-[#F5C84B] transition hover:opacity-90"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Status
            </label>
            <select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatus(e.target.value)
              }
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none focus:border-[#F5C84B]/60"
            >
              <option value="RECEIVED">RECEIVED</option>
              <option value="IN TRANSIT">IN TRANSIT</option>
              <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Optional package notes"
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Weight (kg)
            </label>
            <input
              value={weight}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setWeight(e.target.value)
              }
              placeholder="Optional weight"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
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
              {saving ? "Saving..." : "Add Package"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/packages")}
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
