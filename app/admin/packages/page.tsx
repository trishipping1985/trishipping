"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PackageRow = {
  id: string;
  tracking_code: string | null;
  status: string | null;
  weight_kg: number | null;
  photo_count: number | null;
  created_at?: string | null;
};

type IncomingPackageRow = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  original_tracking_number: string | null;
  store_name: string | null;
  notes: string | null;
  status: string;
  package_photo_url: string | null;
  tri_tracking_code: string | null;
  received_at: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  [key: string]: any;
};

const incomingStatuses = ["waiting", "received", "forwarded", "cancelled"];

const packageStatuses = [
  "RECEIVED",
  "SORTED",
  "WEIGHED",
  "PHOTOGRAPHED",
  "READY_FOR_CONSOLIDATION",
  "CONSOLIDATED",
  "SHIPPED",
  "DELIVERED",
];

export default function AdminPackagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingIncoming, setSavingIncoming] = useState(false);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [incomingPackages, setIncomingPackages] = useState<IncomingPackageRow[]>(
    []
  );
  const [customers, setCustomers] = useState<ProfileRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [originalTrackingNumber, setOriginalTrackingNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [incomingStatus, setIncomingStatus] = useState("received");
  const [triTrackingCode, setTriTrackingCode] = useState("");
  const [notes, setNotes] = useState("");
  const [packagePhotoUrl, setPackagePhotoUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkAccessAndLoad() {
      setLoading(true);
      setErrorMessage("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile || profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      await loadAdminData();

      if (mounted) {
        setLoading(false);
      }
    }

    checkAccessAndLoad();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function loadAdminData() {
    setErrorMessage("");

    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (packageError) {
      setErrorMessage(packageError.message);
    } else {
      setPackages((packageData || []) as PackageRow[]);
    }

    const { data: incomingData, error: incomingError } = await supabase
      .from("incoming_packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (incomingError) {
      setErrorMessage(incomingError.message);
    } else {
      setIncomingPackages((incomingData || []) as IncomingPackageRow[]);
    }

    const { data: profileData } = await supabase.from("profiles").select("*");

    const customerRows = (profileData || []).filter((profile: ProfileRow) => {
      const role = String(profile.role || "").toLowerCase();
      return role !== "admin" && role !== "staff";
    });

    setCustomers(customerRows as ProfileRow[]);
  }

  function customerDisplayName(customer: ProfileRow) {
    return (
      customer.full_name ||
      customer.name ||
      customer.email ||
      customer.phone ||
      customer.id
    );
  }

  function getCustomerLabel(item: IncomingPackageRow) {
    if (item.customer_name) return item.customer_name;

    const customer = customers.find((c) => c.id === item.user_id);

    if (!customer) {
      return item.user_id ? `Customer ID: ${item.user_id.slice(0, 8)}...` : "—";
    }

    return customerDisplayName(customer);
  }

  async function createIncomingPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!customerName.trim() && !selectedCustomerId.trim()) {
      setErrorMessage("Please write a customer name or select a customer.");
      return;
    }

    setSavingIncoming(true);

    const payload = {
      user_id: selectedCustomerId.trim() || null,
      customer_name: customerName.trim() || null,
      original_tracking_number: originalTrackingNumber.trim() || null,
      store_name: storeName.trim() || null,
      status: incomingStatus,
      tri_tracking_code: triTrackingCode.trim() || null,
      notes: notes.trim() || null,
      package_photo_url: packagePhotoUrl.trim() || null,
      received_at:
        incomingStatus === "received" || incomingStatus === "forwarded"
          ? new Date().toISOString()
          : null,
    };

    const { error } = await supabase.from("incoming_packages").insert(payload);

    if (error) {
      setErrorMessage(error.message);
      setSavingIncoming(false);
      return;
    }

    setSelectedCustomerId("");
    setCustomerName("");
    setOriginalTrackingNumber("");
    setStoreName("");
    setIncomingStatus("received");
    setTriTrackingCode("");
    setNotes("");
    setPackagePhotoUrl("");

    await loadAdminData();
    setSavingIncoming(false);
  }

  async function updateIncomingPackage(
    id: string,
    field: keyof IncomingPackageRow,
    value: string | null
  ) {
    setErrorMessage("");

    const updatePayload: any = {
      [field]: value === "" ? null : value,
      updated_at: new Date().toISOString(),
    };

    if (field === "status" && (value === "received" || value === "forwarded")) {
      updatePayload.received_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("incoming_packages")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadAdminData();
  }

  async function updatePackage(id: string, field: string, value: any) {
    setErrorMessage("");

    const { error } = await supabase
      .from("packages")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadAdminData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37]">
            Admin Package Control
          </h1>
          <p className="text-white/60 mt-2">
            Add incoming packages manually and connect them to TRI tracking
            numbers.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/30 p-4">
            {errorMessage}
          </div>
        ) : null}

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Incoming Packages
            </h2>
            <p className="text-white/60 mt-1">
              This section is for original Amazon, UPS, FedEx, DHL, or store
              tracking numbers before they become a final TRI shipment.
            </p>
          </div>

          <form
            onSubmit={createIncomingPackage}
            className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-4 md:p-5 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Customer Name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Write customer name manually"
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Link to Dashboard Customer, Optional
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCustomerId(id);

                    const selected = customers.find((c) => c.id === id);
                    if (selected && !customerName.trim()) {
                      setCustomerName(customerDisplayName(selected));
                    }
                  }}
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                >
                  <option value="">No linked customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customerDisplayName(customer)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Original Tracking #
                </label>
                <input
                  value={originalTrackingNumber}
                  onChange={(e) => setOriginalTrackingNumber(e.target.value)}
                  placeholder="Amazon / UPS / FedEx / DHL"
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Store Name
                </label>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Amazon, Shein, eBay..."
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Status
                </label>
                <select
                  value={incomingStatus}
                  onChange={(e) => setIncomingStatus(e.target.value)}
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                >
                  {incomingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  TRI Tracking Number
                </label>
                <input
                  value={triTrackingCode}
                  onChange={(e) => setTriTrackingCode(e.target.value)}
                  placeholder="Final TRI code"
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Package Photo
                </label>
                <input
                  value={packagePhotoUrl}
                  onChange={(e) => setPackagePhotoUrl(e.target.value)}
                  placeholder="Paste photo URL"
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-1">
                  Note
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write note manually"
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingIncoming}
              className="mt-5 w-full md:w-auto bg-[#d4af37] text-black font-bold px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {savingIncoming ? "Saving..." : "Add Incoming Package"}
            </button>
          </form>

          <div className="space-y-4">
            {incomingPackages.length === 0 ? (
              <div className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10 text-white/60">
                No incoming packages added yet.
              </div>
            ) : (
              incomingPackages.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold">
                        {item.original_tracking_number ||
                          "No original tracking #"}
                      </div>
                      <div className="text-white/60 text-sm mt-1">
                        Customer: {getCustomerLabel(item)}
                      </div>
                      <div className="text-white/60 text-sm">
                        Store: {item.store_name || "—"}
                      </div>
                      <div className="text-white/60 text-sm">
                        TRI Tracking: {item.tri_tracking_code || "—"}
                      </div>
                      <div className="text-white/60 text-sm">
                        Note: {item.notes || "—"}
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-[#d4af37]/15 text-[#d4af37] px-3 py-1 text-xs font-bold">
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <input
                      defaultValue={item.customer_name || ""}
                      placeholder="Customer name"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "customer_name",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={item.original_tracking_number || ""}
                      placeholder="Original tracking #"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "original_tracking_number",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={item.store_name || ""}
                      placeholder="Store name"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "store_name",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "status",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    >
                      {incomingStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    <input
                      defaultValue={item.tri_tracking_code || ""}
                      placeholder="TRI tracking number"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "tri_tracking_code",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={item.package_photo_url || ""}
                      placeholder="Package photo URL"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "package_photo_url",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={item.notes || ""}
                      placeholder="Note"
                      onBlur={(e) =>
                        updateIncomingPackage(
                          item.id,
                          "notes",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded md:col-span-2 xl:col-span-3"
                    />
                  </div>

                  {item.package_photo_url ? (
                    <a
                      href={item.package_photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-[#d4af37] underline"
                    >
                      View package photo
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Existing TRI Packages
            </h2>
            <p className="text-white/60 mt-1">
              This is your original TRI package status control.
            </p>
          </div>

          <div className="space-y-4">
            {packages.length === 0 ? (
              <div className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10 text-white/60">
                No TRI packages found.
              </div>
            ) : (
              packages.map((p) => (
                <div
                  key={p.id}
                  className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10"
                >
                  <div className="font-semibold text-lg">
                    {p.tracking_code || "No tracking code"}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 items-center">
                    <select
                      value={p.status || "RECEIVED"}
                      onChange={(e) =>
                        updatePackage(p.id, "status", e.target.value)
                      }
                      className="bg-black text-white p-2 rounded"
                    >
                      {packageStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      defaultValue={p.weight_kg ?? ""}
                      placeholder="Weight kg"
                      onBlur={(e) =>
                        updatePackage(
                          p.id,
                          "weight_kg",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="bg-black text-white p-2 rounded w-32"
                    />

                    <input
                      type="number"
                      defaultValue={p.photo_count ?? 0}
                      placeholder="Photos"
                      onBlur={(e) =>
                        updatePackage(
                          p.id,
                          "photo_count",
                          e.target.value ? Number(e.target.value) : 0
                        )
                      }
                      className="bg-black text-white p-2 rounded w-24"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}