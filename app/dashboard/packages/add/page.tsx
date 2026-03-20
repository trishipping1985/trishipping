"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CreatePackageResponse = {
  success?: boolean;
  data?: {
    id?: string;
    tracking_code?: string;
  };
  package?: {
    id?: string;
    tracking_code?: string;
  };
  error?: string;
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

  const [files, setFiles] = useState<File[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
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

  const previewUrls = useMemo(() => {
    return files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewUrls]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  }

  function removeFile(indexToRemove: number) {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function uploadPackagePhotos(
    packageId: string,
    tracking: string,
    photoFiles: File[]
  ) {
    if (photoFiles.length === 0) return;

    setUploadingPhotos(true);

    for (const file of photoFiles) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `${tracking}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("package-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("package-photos").getPublicUrl(filePath);

      const { error: photoInsertError } = await supabase
        .from("package_photos")
        .insert({
          package_id: packageId,
          tracking_code: tracking,
          file_path: filePath,
          public_url: publicUrl,
        });

      if (photoInsertError) {
        throw new Error(`Photo record failed: ${photoInsertError.message}`);
      }
    }

    setUploadingPhotos(false);
  }

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

      const data: CreatePackageResponse = await res.json();

      if (!res.ok) {
        setSaving(false);
        setError(data?.error || "Failed to create package");
        return;
      }

      const packageId =
        data?.data?.id || data?.package?.id || "";
      const createdTracking =
        data?.data?.tracking_code || data?.package?.tracking_code || cleanTrackingCode;

      if (!packageId) {
        setSaving(false);
        setError("Package was created but package ID was not returned.");
        return;
      }

      if (files.length > 0) {
        await uploadPackagePhotos(packageId, createdTracking, files);
      }

      setSaving(false);
      setSuccess(
        files.length > 0
          ? "Package and photos added successfully"
          : "Package added successfully"
      );

      setCustomerQuery("");
      setCustomers([]);
      setSelectedCustomer(null);
      setTrackingCode("");
      setStatus("RECEIVED");
      setNotes("");
      setWeight("");
      setFiles([]);

      setTimeout(() => {
        router.push("/dashboard/packages");
      }, 1200);
    } catch (err) {
      console.error(err);
      setSaving(false);
      setUploadingPhotos(false);
      setError(
        err instanceof Error ? err.message : "Failed to create package"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-4xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
              Admin Package Creation
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-[#F5C84B] sm:mt-4 sm:text-4xl">
              Add Box + Upload Photos
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/70 sm:mt-3 sm:text-base sm:leading-7">
              Create a shipment and upload its photos in one flow.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-5 sm:rounded-[28px] sm:p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Customer Search
              </label>

              <input
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setSelectedCustomer(null);
                }}
                placeholder="Search customer by name or email"
                className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
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
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Tracking Code
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="TRI-001"
                  className="flex-1 rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-white outline-none transition focus:border-[#F5C84B]/60"
                >
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="IN TRANSIT">IN TRANSIT</option>
                  <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Weight (kg)
                </label>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Optional weight"
                  className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional package notes"
                rows={4}
                className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Upload Photos
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
                className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#F5C84B] file:px-4 file:py-2 file:font-bold file:text-black"
              />

              {files.length > 0 ? (
                <div className="mt-3 space-y-3">
                  <div className="text-sm text-white/70">
                    {files.length} photo(s) selected
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previewUrls.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-2">
                          <div className="truncate text-xs text-white/70">
                            {item.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="mt-2 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
                disabled={saving || uploadingPhotos}
                className="flex-1 rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? uploadingPhotos
                    ? "Uploading Photos..."
                    : "Saving..."
                  : "Add Package + Photos"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/packages")}
                className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
