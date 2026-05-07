"use client";

import { useEffect, useMemo, useState } from "react";
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
  customer_name?: string;
  customer_email?: string;
};

type ReceiptGroup = {
  groupKey: string;
  user_id: string;
  package_id: string | null;
  tracking_code: string | null;
  customer_name?: string;
  customer_email?: string;
  latest_created_at: string;
  receipts: ReceiptRow[];
};

type UserRoleRow = {
  role: string | null;
};

type PackageLookupRow = {
  id: string;
  tracking_code: string;
  user_id: string | null;
};

type UserLookupRow = {
  id: string;
  full_name: string | null;
  email: string | null;
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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReceiptsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canManageAll, setCanManageAll] = useState(false);

  async function loadPage() {
    setLoading(true);
    setError("");

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

    let receiptRows = (receiptData || []) as ReceiptRow[];

    const userIds = Array.from(
      new Set(
        receiptRows
          .map((receipt) => receipt.user_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    let userMap: Record<
      string,
      { full_name?: string | null; email?: string | null }
    > = {};

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) {
        setError(usersError.message);
        setLoading(false);
        return;
      }

      userMap = Object.fromEntries(
        ((usersData || []) as UserLookupRow[]).map((u) => [
          u.id,
          {
            full_name: u.full_name || null,
            email: u.email || null,
          },
        ])
      );
    }

    receiptRows = receiptRows.map((receipt) => {
      const matchedUser = userMap[receipt.user_id];

      return {
        ...receipt,
        customer_name:
          matchedUser?.full_name || matchedUser?.email || "Unknown Customer",
        customer_email: matchedUser?.email || "",
      };
    });

    setReceipts(receiptRows);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  const filteredReceiptGroups = useMemo(() => {
    const groupMap = new Map<string, ReceiptGroup>();

    receipts.forEach((receipt) => {
      const groupKey = `${receipt.user_id}-${
        receipt.package_id || receipt.tracking_code || receipt.id
      }`;

      const existingGroup = groupMap.get(groupKey);

      if (!existingGroup) {
        groupMap.set(groupKey, {
          groupKey,
          user_id: receipt.user_id,
          package_id: receipt.package_id,
          tracking_code: receipt.tracking_code,
          customer_name: receipt.customer_name,
          customer_email: receipt.customer_email,
          latest_created_at: receipt.created_at,
          receipts: [receipt],
        });

        return;
      }

      existingGroup.receipts.push(receipt);

      const currentLatest = new Date(existingGroup.latest_created_at).getTime();
      const receiptTime = new Date(receipt.created_at).getTime();

      if (receiptTime > currentLatest) {
        existingGroup.latest_created_at = receipt.created_at;
      }
    });

    const groups = Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        receipts: group.receipts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.latest_created_at).getTime() -
          new Date(a.latest_created_at).getTime()
      );

    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups.filter((group) => {
      const groupMatches =
        String(group.tracking_code || "").toLowerCase().includes(q) ||
        String(group.customer_name || "").toLowerCase().includes(q) ||
        String(group.customer_email || "").toLowerCase().includes(q) ||
        formatDate(group.latest_created_at).toLowerCase().includes(q);

      const receiptMatches = group.receipts.some((receipt) => {
        return (
          String(receipt.file_name || "").toLowerCase().includes(q) ||
          String(receipt.note || "").toLowerCase().includes(q) ||
          formatDate(receipt.created_at).toLowerCase().includes(q)
        );
      });

      return groupMatches || receiptMatches;
    });
  }, [receipts, query]);

  const filteredReceiptCount = useMemo(() => {
    return filteredReceiptGroups.reduce(
      (total, group) => total + group.receipts.length,
      0
    );
  }, [filteredReceiptGroups]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploadProgress("");

    const cleanTrackingCode = trackingCode.trim().toUpperCase();
    const uploadCount = files.length;

    if (!cleanTrackingCode) {
      setError("Please enter a TRI tracking code.");
      return;
    }

    if (uploadCount === 0) {
      setError("Please choose at least one invoice or receipt file.");
      return;
    }

    setUploading(true);

    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(authError?.message || "User not found");
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
        throw new Error(packageError.message);
      }

      if (!packageData) {
        throw new Error("TRI tracking code not found or not allowed.");
      }

      const matchedPackage = packageData as PackageLookupRow;
      const safeTracking = cleanTrackingCode.replace(/[^A-Z0-9-_]/gi, "_");

      const receiptRowsToInsert = [];

      for (let index = 0; index < files.length; index += 1) {
        const selectedFile = files[index];

        setUploadProgress(`Uploading ${index + 1} of ${files.length}...`);

        const ext = selectedFile.name.split(".").pop() || "file";
        const fileName = `${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const filePath = `${user.id}/${safeTracking}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(filePath);

        const {
          data: { publicUrl },
        } = supabase.storage.from("receipts").getPublicUrl(filePath);

        receiptRowsToInsert.push({
          user_id: user.id,
          package_id: matchedPackage.id,
          tracking_code: matchedPackage.tracking_code,
          file_name: selectedFile.name,
          file_path: filePath,
          public_url: publicUrl,
          note: note.trim() || null,
        });
      }

      setUploadProgress("Saving files...");

      const { error: insertError } = await supabase
        .from("receipts")
        .insert(receiptRowsToInsert);

      if (insertError) {
        await supabase.storage.from("receipts").remove(uploadedPaths);
        throw new Error(insertError.message);
      }

      setTrackingCode("");
      setNote("");
      setFiles([]);

      const input = document.getElementById(
        "receipt-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await loadPage();

      setSuccess(
        uploadCount === 1
          ? "Invoice / receipt uploaded successfully."
          : `${uploadCount} invoices / receipts uploaded successfully under the same TRI tracking code.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload invoices / receipts."
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }

  async function handleDelete(receipt: ReceiptRow) {
    const confirmed = window.confirm("Delete this invoice / receipt?");
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

    setSuccess("Invoice / receipt deleted successfully.");
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
                Shipment Documents
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                Invoices / Receipts
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                Upload one or multiple purchase invoices or receipts and link
                them to the correct TRI tracking code.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:min-w-[280px]">
              <QuickInfoPill
                label="Files"
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
            Upload Invoices / Receipts
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            For one TRI tracking code, you can select many invoice or receipt
            files together.
          </p>

          <form onSubmit={handleUpload} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                TRI Tracking Code
              </label>
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Enter TRI tracking code"
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Invoice / Receipt Files
              </label>

              <input
                id="receipt-file"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#F5C84B] file:px-4 file:py-2 file:font-bold file:text-black"
              />

              {files.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-[#F5C84B]/15 bg-[#F5C84B]/10 p-4">
                  <div className="text-sm font-bold text-[#F5C84B]">
                    {files.length} file{files.length === 1 ? "" : "s"} selected
                  </div>

                  <div className="mt-3 max-h-40 overflow-x-auto overflow-y-auto rounded-xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                      <thead className="bg-black/20 text-white/45">
                        <tr>
                          <th className="px-3 py-3 font-bold uppercase tracking-[0.14em]">
                            #
                          </th>
                          <th className="px-3 py-3 font-bold uppercase tracking-[0.14em]">
                            File Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {files.map((selectedFile, index) => (
                          <tr key={`${selectedFile.name}-${index}`}>
                            <td className="whitespace-nowrap px-3 py-3 text-white/70">
                              {index + 1}
                            </td>
                            <td className="min-w-[260px] break-all px-3 py-3 text-white/75">
                              {selectedFile.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for this upload"
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
              {uploading
                ? uploadProgress || "Uploading..."
                : files.length > 1
                  ? `Upload ${files.length} Files`
                  : "Upload File"}
            </button>
          </form>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#F5C84B] sm:text-2xl">
              Uploaded Invoices / Receipts
            </h2>

            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {loading
                ? "Loading..."
                : `${filteredReceiptGroups.length} shipment${
                    filteredReceiptGroups.length === 1 ? "" : "s"
                  } / ${filteredReceiptCount} file${
                    filteredReceiptCount === 1 ? "" : "s"
                  }`}
            </span>
          </div>

          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, TRI tracking code, file name, note, or date"
              className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
            />
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              Loading invoices / receipts...
            </div>
          ) : filteredReceiptGroups.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No invoices / receipts found.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredReceiptGroups.map((group) => (
                <div
                  key={group.groupKey}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                >
                  <div className="border-b border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                          Shipment
                        </div>

                        <div className="mt-1 break-all text-lg font-extrabold text-[#F5C84B] sm:text-xl">
                          {group.tracking_code || "-"}
                        </div>

                        <div className="mt-2 text-sm text-white/55">
                          {group.receipts.length} file
                          {group.receipts.length === 1 ? "" : "s"} uploaded
                        </div>
                      </div>

                      <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                        Latest: {formatDate(group.latest_created_at)}
                      </div>
                    </div>

                    {canManageAll ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 sm:grid-cols-2">
                        <InfoItem
                          label="Customer Name"
                          value={group.customer_name || "Unknown Customer"}
                        />
                        <InfoItem
                          label="Customer Email"
                          value={group.customer_email || "No email"}
                          breakAll
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                      <thead className="bg-[#0B162B] text-white/45">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            #
                          </th>
                          <th className="min-w-[260px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            File Name
                          </th>
                          <th className="min-w-[190px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            Uploaded
                          </th>
                          <th className="min-w-[220px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            Note
                          </th>
                          <th className="whitespace-nowrap px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            View
                          </th>
                          <th className="whitespace-nowrap px-4 py-4 text-[10px] font-bold uppercase tracking-[0.14em]">
                            Delete
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/10">
                        {group.receipts.map((receipt, index) => (
                          <tr
                            key={receipt.id}
                            className="bg-black/10 transition hover:bg-white/[0.03]"
                          >
                            <td className="whitespace-nowrap px-4 py-4 font-bold text-white/70">
                              {index + 1}
                            </td>

                            <td className="min-w-[260px] break-all px-4 py-4 font-semibold text-white">
                              {receipt.file_name}
                            </td>

                            <td className="min-w-[190px] px-4 py-4 text-white/70">
                              {formatDateTime(receipt.created_at)}
                            </td>

                            <td className="min-w-[220px] px-4 py-4 text-white/70">
                              {receipt.note || "No note"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              <Link
                                href={receipt.public_url}
                                target="_blank"
                                className="inline-flex items-center justify-center rounded-xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-2 text-xs font-bold text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
                              >
                                Open
                              </Link>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              <button
                                type="button"
                                onClick={() => handleDelete(receipt)}
                                className="inline-flex items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
      <div
        className={`mt-1 text-sm text-white/80 ${breakAll ? "break-all" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}