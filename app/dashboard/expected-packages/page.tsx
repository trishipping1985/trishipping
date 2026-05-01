"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

function customerDisplayName(profile: ProfileRow | null, fallbackEmail?: string | null) {
  if (!profile) return fallbackEmail || null;

  return (
    profile.name ||
    profile.email ||
    profile.phone ||
    fallbackEmail ||
    profile.id ||
    null
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusLabel(status?: string | null) {
  const cleanStatus = String(status || "").toLowerCase();

  if (cleanStatus === "waiting") return "EXPECTED";
  if (cleanStatus === "received") return "RECEIVED";
  if (cleanStatus === "forwarded") return "FORWARDED";
  if (cleanStatus === "cancelled") return "CANCELLED";

  return cleanStatus ? cleanStatus.toUpperCase() : "EXPECTED";
}

export default function ExpectedPackagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [expectedPackages, setExpectedPackages] = useState<IncomingPackageRow[]>(
    []
  );

  const [originalTrackingNumber, setOriginalTrackingNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
      }

      const nameFromProfile =
        customerDisplayName((profile as ProfileRow | null) || null, user.email) ||
        user.id;

      if (mounted) {
        setUserId(user.id);
        setCustomerName(nameFromProfile);
      }

      await loadExpectedPackages(user.id);

      if (mounted) {
        setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function loadExpectedPackages(currentUserId: string) {
    const { data, error } = await supabase
      .from("incoming_packages")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setExpectedPackages((data || []) as IncomingPackageRow[]);
  }

  async function createExpectedPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanTracking = originalTrackingNumber.trim();
    const cleanStoreName = storeName.trim();
    const cleanNotes = notes.trim();

    if (!userId) {
      setErrorMessage("Please log in again before adding an expected package.");
      return;
    }

    if (!cleanTracking) {
      setErrorMessage("Please enter the original tracking number.");
      return;
    }

    if (!cleanStoreName) {
      setErrorMessage("Please enter the store name.");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: userId,
      customer_name: customerName || null,
      original_tracking_number: cleanTracking,
      store_name: cleanStoreName,
      notes: cleanNotes || null,
      status: "waiting",
      package_photo_url: null,
      tri_tracking_code: null,
      received_at: null,
    };

    const { error } = await supabase.from("incoming_packages").insert(payload);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setOriginalTrackingNumber("");
    setStoreName("");
    setNotes("");
    setSuccessMessage("Expected package added. Admin can now see it.");

    await loadExpectedPackages(userId);

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-4">
        Loading expected packages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 py-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37]">
            Expected Packages
          </h1>
          <p className="text-white/60 mt-2">
            Add tracking numbers for packages you are expecting. TRI Shipping
            will see them in the admin Incoming Packages page.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/30 p-4">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-5 rounded-xl bg-green-500/10 text-green-200 ring-1 ring-green-500/30 p-4">
            {successMessage}
          </div>
        ) : null}

        <form
          onSubmit={createExpectedPackage}
          className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-4 md:p-5 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-1">
                Original Tracking #
              </label>
              <input
                value={originalTrackingNumber}
                onChange={(e) => setOriginalTrackingNumber(e.target.value)}
                placeholder="Amazon / UPS / FedEx / DHL tracking number"
                className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10 outline-none focus:ring-[#d4af37]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-1">
                Store Name
              </label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Amazon, Shein, eBay, Nike..."
                className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10 outline-none focus:ring-[#d4af37]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-1">
                Note, Optional
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: 2 items inside, fragile, under my order name..."
                rows={4}
                className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10 outline-none focus:ring-[#d4af37] resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full md:w-auto bg-[#d4af37] text-black font-bold px-6 py-3 rounded-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Expected Package"}
          </button>
        </form>

        <section>
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              My Expected Packages
            </h2>
            <p className="text-white/60 mt-1">
              These are the packages you submitted to TRI Shipping.
            </p>
          </div>

          <div className="space-y-4">
            {expectedPackages.length === 0 ? (
              <div className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10 text-white/60">
                You have not added any expected packages yet.
              </div>
            ) : (
              expectedPackages.map((item) => (
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
                        Store: {item.store_name || "—"}
                      </div>

                      <div className="text-white/60 text-sm">
                        TRI Tracking:{" "}
                        {item.tri_tracking_code || "Not assigned yet"}
                      </div>

                      <div className="text-white/60 text-sm">
                        Submitted: {formatDate(item.created_at)}
                      </div>

                      <div className="text-white/60 text-sm">
                        Note: {item.notes || "—"}
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-[#d4af37]/15 text-[#d4af37] px-3 py-1 text-xs font-bold">
                      {statusLabel(item.status)}
                    </span>
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
      </div>
    </div>
  );
}