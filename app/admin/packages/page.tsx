"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PackageRow = {
  id: string;
  tracking_code: string | null;
  status: string | null;
  weight_kg: number | null;
  photo_count: number | null;
  orders_count?: number | null;
  warehouse_id?: string | null;
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

type GroupedIncomingPackage = {
  groupKey: string;
  rows: IncomingPackageRow[];
  user_id: string | null;
  customer_name: string | null;
  store_name: string | null;
  notes: string | null;
  status: string;
  package_photo_url: string | null;
  tri_tracking_code: string | null;
  received_at: string | null;
  created_at: string | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: string | null;
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

type SendEmailResponse = {
  success?: boolean;
  error?: string;
};

type WarehouseOption = {
  id: string;
  country: string;
  name: string;
};

const PACKAGE_PHOTOS_BUCKET = "package-photos";

const WAREHOUSE_OPTIONS: WarehouseOption[] = [
  {
    id: "5e816295-84d0-47aa-890d-a63e996dbcff",
    country: "USA",
    name: "USA Warehouse",
  },
  {
    id: "19a71970-a78f-4db7-aab0-ec90c60f68b8",
    country: "Canada",
    name: "Canada Warehouse",
  },
  {
    id: "c8fd8a13-f82c-450c-aac0-b125a91617a5",
    country: "Philippines",
    name: "Philippines Warehouse",
  },
];

const DEFAULT_WAREHOUSE_ID = "5e816295-84d0-47aa-890d-a63e996dbcff";

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

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function isStaffRole(role?: string | null) {
  const cleanRole = normalizeRole(role);

  return (
    cleanRole === "admin" ||
    cleanRole === "owner" ||
    cleanRole === "staff" ||
    cleanRole === "staff2" ||
    cleanRole === "staff4"
  );
}

function parseTrackingNumbers(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractTriNumber(code?: string | null) {
  const match = String(code || "")
    .trim()
    .toUpperCase()
    .match(/^TRI-(\d+)$/);

  if (!match) return null;

  const numberValue = Number(match[1]);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeCustomerName(name: string | null) {
  const raw = String(name || "").trim();
  if (!raw) return "Valued Client";

  const cleaned = raw.replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();

  const blockedValues = [
    "customer",
    "valued customer",
    "valued client",
    "tri shipping",
    "info@trishipping.info",
  ];

  if (blockedValues.includes(lower)) {
    return "Valued Client";
  }

  const words = cleaned.split(" ");
  if (words.length >= 2) {
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if (uniqueWords.size === 1) {
      return "Valued Client";
    }
  }

  if (cleaned.length < 2) {
    return "Valued Client";
  }

  return cleaned;
}

function warehouseDisplayName(warehouseId?: string | null) {
  const warehouse = WAREHOUSE_OPTIONS.find((item) => item.id === warehouseId);

  if (!warehouse) {
    return warehouseId ? `Unknown warehouse: ${warehouseId}` : "Unassigned";
  }

  return `${warehouse.country} — ${warehouse.name}`;
}

async function generateNextTriTrackingCode() {
  const { data: incomingData, error: incomingError } = await supabase
    .from("incoming_packages")
    .select("tri_tracking_code")
    .not("tri_tracking_code", "is", null);

  if (incomingError) {
    throw new Error(incomingError.message);
  }

  const { data: packageData, error: packageError } = await supabase
    .from("packages")
    .select("tracking_code")
    .not("tracking_code", "is", null);

  if (packageError) {
    throw new Error(packageError.message);
  }

  const incomingNumbers = ((incomingData || []) as IncomingPackageRow[])
    .map((row) => extractTriNumber(row.tri_tracking_code))
    .filter((value): value is number => value !== null);

  const packageNumbers = ((packageData || []) as PackageRow[])
    .map((row) => extractTriNumber(row.tracking_code))
    .filter((value): value is number => value !== null);

  const highestNumber = Math.max(122, ...incomingNumbers, ...packageNumbers);

  return `TRI-${highestNumber + 1}`;
}

export default function AdminPackagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingIncoming, setSavingIncoming] = useState(false);
  const [generatingTriCode, setGeneratingTriCode] = useState(false);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [incomingPackages, setIncomingPackages] = useState<IncomingPackageRow[]>(
    []
  );
  const [customers, setCustomers] = useState<ProfileRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState(DEFAULT_WAREHOUSE_ID);
  const [customerName, setCustomerName] = useState("");
  const [originalTrackingNumbers, setOriginalTrackingNumbers] = useState("");
  const [generatedTriCode, setGeneratedTriCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [notes, setNotes] = useState("");
  const [packagePhotoFiles, setPackagePhotoFiles] = useState<File[]>([]);

  const previewUrls = useMemo(() => {
    return packagePhotoFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [packagePhotoFiles]);

  const groupedIncomingPackages = useMemo(() => {
    const groupMap = new Map<string, GroupedIncomingPackage>();

    incomingPackages.forEach((item) => {
      const groupKey = item.tri_tracking_code || item.id;
      const existing = groupMap.get(groupKey);

      if (!existing) {
        groupMap.set(groupKey, {
          groupKey,
          rows: [item],
          user_id: item.user_id,
          customer_name: item.customer_name,
          store_name: item.store_name,
          notes: item.notes,
          status: item.status,
          package_photo_url: item.package_photo_url,
          tri_tracking_code: item.tri_tracking_code,
          received_at: item.received_at,
          created_at: item.created_at,
        });

        return;
      }

      existing.rows.push(item);

      if (!existing.customer_name && item.customer_name) {
        existing.customer_name = item.customer_name;
      }

      if (!existing.store_name && item.store_name) {
        existing.store_name = item.store_name;
      }

      if (!existing.notes && item.notes) {
        existing.notes = item.notes;
      }

      if (!existing.package_photo_url && item.package_photo_url) {
        existing.package_photo_url = item.package_photo_url;
      }
    });

    return Array.from(groupMap.values());
  }, [incomingPackages]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewUrls]);

  useEffect(() => {
    let mounted = true;

    async function checkAccessAndLoad() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: userRoleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const { data: profileRoleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role =
        normalizeRole(userRoleData?.role) ||
        normalizeRole(profileRoleData?.role);

      if (!isStaffRole(role)) {
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .order("full_name", { ascending: true });

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*");

    if (userError) {
      setErrorMessage(userError.message);
    }

    if (profileError) {
      setErrorMessage(profileError.message);
    }

    const customerMap = new Map<string, ProfileRow>();

    (profileData || []).forEach((profile: ProfileRow) => {
      customerMap.set(profile.id, {
        ...profile,
        role: profile.role || null,
      });
    });

    ((userData || []) as UserRow[]).forEach((user) => {
      const existing = customerMap.get(user.id);

      customerMap.set(user.id, {
        ...(existing || {}),
        id: user.id,
        full_name: user.full_name || existing?.full_name || null,
        email: user.email || existing?.email || null,
        role: user.role || existing?.role || null,
      });
    });

    const customerRows = Array.from(customerMap.values())
      .filter((customer) => !isStaffRole(customer.role))
      .sort((a, b) =>
        customerDisplayName(a).localeCompare(customerDisplayName(b))
      );

    setCustomers(customerRows);
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

  function getCustomerLabel(group: GroupedIncomingPackage) {
    if (group.customer_name) return group.customer_name;

    const customer = customers.find((c) => c.id === group.user_id);

    if (!customer) {
      return group.user_id ? `Customer ID: ${group.user_id.slice(0, 8)}...` : "—";
    }

    return customerDisplayName(customer);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    setPackagePhotoFiles(selectedFiles);
  }

  function removePhoto(indexToRemove: number) {
    setPackagePhotoFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  }

  async function uploadPackagePhotos(
    packageId: string,
    trackingCode: string,
    files: File[]
  ) {
    const uploadedPhotos: {
      filePath: string;
      publicUrl: string;
    }[] = [];

    for (const file of files) {
      const fileExt =
        file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        "jpg";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const filePath = `${trackingCode}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(PACKAGE_PHOTOS_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PACKAGE_PHOTOS_BUCKET).getPublicUrl(filePath);

      const { error: photoInsertError } = await supabase
        .from("package_photos")
        .insert({
          package_id: packageId,
          tracking_code: trackingCode,
          file_path: filePath,
          public_url: publicUrl,
        });

      if (photoInsertError) {
        throw new Error(`Photo record failed: ${photoInsertError.message}`);
      }

      uploadedPhotos.push({
        filePath,
        publicUrl,
      });
    }

    return uploadedPhotos;
  }

  async function handleGenerateTriCode() {
    setErrorMessage("");
    setSuccessMessage("");
    setGeneratingTriCode(true);

    try {
      const nextCode = await generateNextTriTrackingCode();
      setGeneratedTriCode(nextCode);
      setSuccessMessage(`Generated TRI code: ${nextCode}`);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to generate TRI code.");
    }

    setGeneratingTriCode(false);
  }

  async function createMainPackage({
    userId,
    warehouseId,
    trackingCode,
    ordersCount,
    photoCount,
    note,
  }: {
    userId: string | null;
    warehouseId: string;
    trackingCode: string;
    ordersCount: number;
    photoCount: number;
    note: string;
  }) {
    const res = await fetch("/api/packages/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        warehouse_id: warehouseId,
        tracking_code: trackingCode,
        status: "RECEIVED",
        orders_count: ordersCount,
        notes: note,
        weight_kg: "",
      }),
    });

    const data: CreatePackageResponse = await res.json();

    if (!res.ok || data?.error) {
      throw new Error(data?.error || "Failed to create package record.");
    }

    const packageId = data?.data?.id || data?.package?.id || "";
    const createdTracking =
      data?.data?.tracking_code || data?.package?.tracking_code || trackingCode;

    if (!packageId) {
      throw new Error("Package was created but package ID was not returned.");
    }

    if (photoCount > 0) {
      const { error: updateError } = await supabase
        .from("packages")
        .update({
          photo_count: photoCount,
          orders_count: ordersCount,
        })
        .eq("id", packageId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    return {
      packageId,
      createdTracking,
    };
  }

  async function sendWarehouseReceiptEmail({
    customer,
    trackingCode,
    ordersCount,
  }: {
    customer: ProfileRow | null;
    trackingCode: string;
    ordersCount: number;
  }) {
    const customerEmail = String(customer?.email || "").trim();

    if (!customerEmail) {
      return {
        sent: false,
        reason: "No customer email found.",
      };
    }

    const safeCustomerName = normalizeCustomerName(
      customer?.full_name || customer?.name || customerName
    );

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: customerEmail,
        subject: `Warehouse Receipt: ${trackingCode}`,
        trackingCode,
        status: "RECEIVED",
        customerName: safeCustomerName,
        ordersCount,
        message: `We have successfully received your package at our warehouse under TRI tracking code ${trackingCode}. This received package contains ${ordersCount} original tracking number(s).

Our team is currently processing it for the next shipping stage. You can log in to your TRI Shipping dashboard to view the received package details and photos.`,
      }),
    });

    const data: SendEmailResponse = await res.json();

    if (!res.ok || !data?.success) {
      return {
        sent: false,
        reason: data?.error || "Email failed.",
      };
    }

    return {
      sent: true,
      reason: "",
    };
  }

  async function createIncomingPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanTrackingNumbers = parseTrackingNumbers(originalTrackingNumbers);
    const cleanNotes = notes.trim();

    if (!selectedWarehouseId.trim()) {
      setErrorMessage("Please select the receiving warehouse.");
      return;
    }

    if (!customerName.trim() && !selectedCustomerId.trim()) {
      setErrorMessage("Please write a customer name or select a customer.");
      return;
    }

    if (cleanTrackingNumbers.length === 0) {
      setErrorMessage("Please enter at least one original tracking number.");
      return;
    }

    if (cleanTrackingNumbers.length > 5) {
      setErrorMessage("Please add a maximum of 5 tracking numbers at one time.");
      return;
    }

    setSavingIncoming(true);

    try {
      const selectedCustomer =
        customers.find((customer) => customer.id === selectedCustomerId) ||
        null;

      const triCode =
        generatedTriCode.trim().toUpperCase() ||
        (await generateNextTriTrackingCode());

      const linkedCustomerId = selectedCustomerId.trim() || null;
      const now = new Date().toISOString();

      const { packageId, createdTracking } = await createMainPackage({
        userId: linkedCustomerId,
        warehouseId: selectedWarehouseId,
        trackingCode: triCode,
        ordersCount: cleanTrackingNumbers.length,
        photoCount: packagePhotoFiles.length,
        note: cleanNotes,
      });

      const uploadedPhotos =
        packagePhotoFiles.length > 0
          ? await uploadPackagePhotos(
              packageId,
              createdTracking,
              packagePhotoFiles
            )
          : [];

      const mainPhotoUrl = uploadedPhotos[0]?.publicUrl || null;

      const payload = cleanTrackingNumbers.map((trackingNumber) => ({
        user_id: linkedCustomerId,
        customer_name: customerName.trim() || null,
        original_tracking_number: trackingNumber,
        store_name: storeName.trim() || null,
        status: "received",
        tri_tracking_code: createdTracking,
        notes: cleanNotes || null,
        package_photo_url: mainPhotoUrl,
        received_at: now,
      }));

      const { error } = await supabase.from("incoming_packages").insert(payload);

      if (error) {
        setErrorMessage(error.message);
        setSavingIncoming(false);
        return;
      }

      const emailResult = await sendWarehouseReceiptEmail({
        customer: selectedCustomer,
        trackingCode: createdTracking,
        ordersCount: cleanTrackingNumbers.length,
      });

      setSelectedCustomerId("");
      setCustomerName("");
      setOriginalTrackingNumbers("");
      setGeneratedTriCode("");
      setStoreName("");
      setNotes("");
      setPackagePhotoFiles([]);

      const fileInput = document.getElementById(
        "package-photo-upload"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      const baseMessage =
        cleanTrackingNumbers.length === 1
          ? `Received package added with TRI code ${createdTracking}, warehouse ${warehouseDisplayName(
              selectedWarehouseId
            )}, and ${uploadedPhotos.length} photo(s).`
          : `${cleanTrackingNumbers.length} received packages added under TRI code ${createdTracking}, warehouse ${warehouseDisplayName(
              selectedWarehouseId
            )}, with ${uploadedPhotos.length} photo(s).`;

      setSuccessMessage(
        emailResult.sent
          ? `${baseMessage} Email sent to customer.`
          : `${baseMessage} Email not sent: ${emailResult.reason}`
      );

      await loadAdminData();
    } catch (error: any) {
      setErrorMessage(error?.message || "Package save failed.");
    }

    setSavingIncoming(false);
  }

  async function updateIncomingPackage(
    id: string,
    field: keyof IncomingPackageRow,
    value: string | null
  ) {
    setErrorMessage("");
    setSuccessMessage("");

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

  async function updateIncomingPackageGroup(
    group: GroupedIncomingPackage,
    field: keyof IncomingPackageRow,
    value: string | null
  ) {
    setErrorMessage("");
    setSuccessMessage("");

    const ids = group.rows.map((row) => row.id);

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
      .in("id", ids);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadAdminData();
  }

  async function updatePackage(id: string, field: string, value: any) {
    setErrorMessage("");
    setSuccessMessage("");

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
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37]">
              Received Packages
            </h1>
            <p className="text-white/60 mt-2">
              Add packages received at the warehouse, upload multiple photos, and
              generate one TRI tracking number for the full received group.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl bg-[#d4af37] px-5 py-3 text-center text-sm font-bold text-black shadow-lg shadow-black/20 transition hover:bg-[#f0c94a] md:w-auto"
          >
            ← Back to Dashboard
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/30 p-4">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-xl bg-green-500/10 text-green-200 ring-1 ring-green-500/30 p-4">
            {successMessage}
          </div>
        ) : null}

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Add Received Package
            </h2>
            <p className="text-white/60 mt-1">
              Select the warehouse, select the customer, add 1 to 5 original
              tracking numbers, upload photos, and use one TRI code for the full
              group.
            </p>
          </div>

          <form
            onSubmit={createIncomingPackage}
            className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-4 md:p-5 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Receiving Warehouse
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  required
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                >
                  {WAREHOUSE_OPTIONS.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.country} — {warehouse.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/50">
                  Choose where this package was physically received.
                </p>
              </div>

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
                    if (selected) {
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

              <div className="md:col-span-2 xl:col-span-1">
                <label className="block text-sm text-white/70 mb-1">
                  Original Tracking Numbers
                </label>
                <textarea
                  value={originalTrackingNumbers}
                  onChange={(e) => setOriginalTrackingNumbers(e.target.value)}
                  placeholder={`Put 1 to 5 tracking numbers here\nOne per line\nExample:\n1)TBA330595548665\n2)TBA123456789000`}
                  rows={5}
                  className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10 resize-none"
                />
                <p className="mt-2 text-xs text-white/50">
                  All tracking numbers submitted together will use the same TRI
                  tracking code.
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  TRI Tracking Code
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={generatedTriCode}
                    onChange={(e) =>
                      setGeneratedTriCode(e.target.value.toUpperCase())
                    }
                    placeholder="TRI-123"
                    className="w-full bg-black text-white p-3 rounded-xl ring-1 ring-white/10"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateTriCode}
                    disabled={generatingTriCode || savingIncoming}
                    className="rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-black disabled:opacity-60"
                  >
                    {generatingTriCode ? "Generating..." : "Generate"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-white/50">
                  Optional. If left empty, the system will generate one
                  automatically when saving.
                </p>
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

              <div className="md:col-span-2 xl:col-span-3">
                <label className="block text-sm text-white/70 mb-1">
                  Package Photos
                </label>
                <input
                  id="package-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="w-full rounded-xl bg-black p-3 text-white ring-1 ring-white/10 file:mr-4 file:rounded-lg file:border-0 file:bg-[#d4af37] file:px-4 file:py-2 file:font-bold file:text-black"
                />
                <p className="mt-2 text-xs text-white/50">
                  Optional. You can upload multiple photos. The first photo will
                  show on Received Packages, and all photos will show in Package
                  Photos.
                </p>

                {previewUrls.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {previewUrls.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
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
                            onClick={() => removePhoto(index)}
                            className="mt-2 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2 xl:col-span-3">
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
              {savingIncoming ? "Saving..." : "Add Received Package"}
            </button>
          </form>

          <div className="space-y-4">
            {groupedIncomingPackages.length === 0 ? (
              <div className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10 text-white/60">
                No received packages added yet.
              </div>
            ) : (
              groupedIncomingPackages.map((group) => (
                <div
                  key={group.groupKey}
                  className="bg-white/5 p-4 rounded-xl ring-1 ring-white/10"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="text-white/60 text-sm">
                        TRI Tracking #
                      </div>

                      <div className="mt-1 text-xl font-bold text-[#d4af37] break-words">
                        {group.tri_tracking_code || "No TRI tracking #"}
                      </div>

                      <div className="mt-4 text-white/60 text-sm">
                        Package Original Tracking #
                      </div>

                      <div className="mt-2 space-y-2">
                        {group.rows.map((row, index) => (
                          <div
                            key={row.id}
                            className="rounded-xl bg-black/25 p-3 text-white break-words"
                          >
                            {row.original_tracking_number ||
                              `Original tracking #${index + 1}`}
                          </div>
                        ))}
                      </div>

                      <div className="text-white/60 text-sm mt-4">
                        Customer: {getCustomerLabel(group)}
                      </div>
                      <div className="text-white/60 text-sm">
                        Store: {group.store_name || "—"}
                      </div>
                      <div className="text-white/60 text-sm">
                        Packages inside this TRI code: {group.rows.length}
                      </div>
                      <div className="text-white/60 text-sm">
                        Note: {group.notes || "—"}
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-[#d4af37]/15 text-[#d4af37] px-3 py-1 text-xs font-bold">
                      {group.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <input
                      defaultValue={group.customer_name || ""}
                      placeholder="Customer name"
                      onBlur={(e) =>
                        updateIncomingPackageGroup(
                          group,
                          "customer_name",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={group.store_name || ""}
                      placeholder="Store name"
                      onBlur={(e) =>
                        updateIncomingPackageGroup(
                          group,
                          "store_name",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <select
                      value={group.status}
                      onChange={(e) =>
                        updateIncomingPackageGroup(
                          group,
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
                      defaultValue={group.tri_tracking_code || ""}
                      placeholder="TRI tracking number"
                      onBlur={(e) =>
                        updateIncomingPackageGroup(
                          group,
                          "tri_tracking_code",
                          e.target.value
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    />

                    <input
                      defaultValue={group.notes || ""}
                      placeholder="Note"
                      onBlur={(e) =>
                        updateIncomingPackageGroup(group, "notes", e.target.value)
                      }
                      className="bg-black text-white p-2 rounded md:col-span-2"
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 text-sm text-white/60">
                      Edit original tracking numbers
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {group.rows.map((row, index) => (
                        <input
                          key={row.id}
                          defaultValue={row.original_tracking_number || ""}
                          placeholder={`Original tracking #${index + 1}`}
                          onBlur={(e) =>
                            updateIncomingPackage(
                              row.id,
                              "original_tracking_number",
                              e.target.value
                            )
                          }
                          className="bg-black text-white p-2 rounded"
                        />
                      ))}
                    </div>
                  </div>

                  {group.package_photo_url ? (
                    <a
                      href={group.package_photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-4 text-[#d4af37] underline"
                    >
                      View main package photo
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

                  <div className="mt-2 text-sm text-white/50">
                    Warehouse: {warehouseDisplayName(p.warehouse_id)}
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

                    <select
                      value={p.warehouse_id || ""}
                      onChange={(e) =>
                        updatePackage(
                          p.id,
                          "warehouse_id",
                          e.target.value || null
                        )
                      }
                      className="bg-black text-white p-2 rounded"
                    >
                      <option value="">Unassigned Warehouse</option>
                      {WAREHOUSE_OPTIONS.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.country} — {warehouse.name}
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