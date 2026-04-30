"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type ReceiptRow = {
  id: string;
  user_id: string;
  package_id: string | null;
  tracking_code: string | null;
  file_name: string;
  file_path: string;
  public_url: string;
  note: string | null;
  created_at: string;
};

type UserRoleRow = {
  role: string | null;
};

type PackageLookupRow = {
  id: string;
  tracking_code: string;
  user_id: string | null;
};

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReceiptsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canManageAll, setCanManageAll] = useState(false);

  async function loadPage() {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(authError?.message || "User not found");
      setLoading(false);
      return;
    }

    const { data: roleRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = normalizeRole((roleRow as UserRoleRow | null)?.role);
    const staffAllowed =
      role === "admin" ||
      role === "owner" ||
      role === "staff" ||
      role === "staff2" ||
      role === "staff4";

    setCanManageAll(staffAllowed);

    let receiptQuery = supabase
      .from("receipts")
      .select(
        "id, user_id, package_id, tracking_code, file_name, file_path, public_url, note, created_at"
      )
      .order("created_at", { ascending: false });

    if (!staffAllowed) {
      receiptQuery = receiptQuery.eq("user_id", user.id);
    }

    const { data: receiptData, error: receiptError } = await receiptQuery;

    if (receiptError) {
      setError(receiptError.message);
      setLoading(false);
      return;
    }

    setReceipts((receiptData || []) as ReceiptRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanTrackingCode = trackingCode.trim().toUpperCase();

    if (!cleanTrackingCode) {
      setError("Please enter a tracking code.");
      return;
    }

    if (!file) {
      setError("Please choose a receipt file.");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(authError?.message || "User not found");
        setUploading(false);
        return;
      }

      const { data: roleRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = normalizeRole((roleRow as UserRoleRow | null)?.role);
      const staffAllowed =
        role === "admin" ||
        role === "owner" ||
        role === "staff" ||
        role === "staff2" ||
        role === "staff4";

      let packageQuery = supabase
        .from("packages")
        .select("id, tracking_code, user_id")
        .eq("tracking_code", cleanTrackingCode)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!staffAllowed) {
        packageQuery = packageQuery.eq("user_id", user.id);
      }

      const { data: packageData, error: packageError } =
        await packageQuery.maybeSingle();

      if (packageError) {
        setError(packageError.message);
        setUploading(false);
        return;
      }

      if (!packageData) {
        setError("Tracking code not found or not allowed.");
        setUploading(false);
        return;
      }

      const matchedPackage = packageData as PackageLookupRow;

      const ext = file.name.split(".").pop() || "file";
      const safeTracking = cleanTrackingCode.replace(/[^A-Z0-9-_]/gi, "_");
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `${user.id}/${safeTracking}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("receipts").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("receipts").insert({
        user_id: user.id,
        package_id: matchedPackage.id,
        tracking_code: matchedPackage.tracking_code,
        file_name: file.name,
        file_path: filePath,
        public_url: publicUrl,
        note: note.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        setUploading(false);
        return;
      }

      setSuccess("Receipt uploaded successfully.");
      setTrackingCode("");
      setNote("");
      setFile(null);

      const input = document.getElementById(
        "receipt-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await loadPage();
    } catch (err) {
      console.error(err);
      setError("Failed to upload receipt.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(receipt: ReceiptRow) {
    const confirmed = window.confirm("Delete this receipt?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: storageError } = await supabase.storage
      .from("receipts")
      .remove([receipt.file_path]);

    if (storageError) {
      setError(storageError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("receipts")
      .delete()
      .eq("id", receipt.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Receipt deleted successfully.");
    await loadPage();
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                Shipment Receipts
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                Receipts
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                Upload your purchase receipts and link them to the correct shipment.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:min-w-[280px]">
              <QuickInfoPill
                label="Receipts"
                value={loading ? "Loading" : String(receipts.length)}
              />
              <QuickInfoPill
                label="View"
                value={canManageAll ? "Staff / Admin" : "Customer"}
              />
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-5 sm:rounded-[28px] sm:p-6">
          <h2 className="text-lg font-bold text-[#F5C84B] sm:text-2xl">
            Upload Receipt
          </h2>

          <form onSubmit={handleUpload} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Tracking Code
              </label>
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Enter tracking code manually"
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Receipt File
              </label>
              <input
                id="receipt-file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#F5C84B] file:px-4 file:py-2 file:font-bold file:text-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note about this receipt"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-2xl bg-[#F5C84B] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Receipt"}
            </button>
          </form>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#F5C84B] sm:text-2xl">
              Uploaded Receipts
            </h2>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {loading
                ? "Loading..."
                : `${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              Loading receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No receipts uploaded yet.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                        Shipment
                      </div>
                      <div className="mt-1 break-all text-lg font-extrabold text-[#F5C84B]">
                        {receipt.tracking_code || "-"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(receipt)}
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <InfoItem label="File Name" value={receipt.file_name} breakAll />
                    <InfoItem label="Date" value={formatDate(receipt.created_at)} />
                    <InfoItem label="Note" value={receipt.note || "No note"} />
                  </div>

                  <div className="mt-4">
                    <Link
                      href={receipt.public_url}
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-4 py-3 text-sm font-bold text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
                    >
                      Open Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QuickInfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-xl sm:px-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 sm:tracking-[0.24em]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className={`mt-1 text-sm text-white/80 ${breakAll ? "break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}