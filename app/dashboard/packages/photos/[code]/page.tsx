"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  tracking_code: string;
  photo_count: number | null;
};

export default function PackagePhotosPage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = decodeURIComponent(String(params.code || ""))
    .trim()
    .toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    async function loadPackage() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("packages")
        .select("id, tracking_code, photo_count")
        .eq("tracking_code", codeParam)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      if (!data) {
        setError("Package not found");
        return;
      }

      setPkg(data as PackageRow);
    }

    if (codeParam) loadPackage();
  }, [codeParam]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!pkg) {
      setError("Package not found");
      return;
    }

    if (!files || files.length === 0) {
      setError("Please choose at least one photo");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${pkg.tracking_code}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("package-photos")
        .upload(fileName, file, {
          upsert: false,
        });

      if (uploadError) {
        setSaving(false);
        setError(uploadError.message);
        return;
      }

      uploadedCount += 1;
    }

    const nextCount = (pkg.photo_count || 0) + uploadedCount;

    const { error: updateError } = await supabase
      .from("packages")
      .update({ photo_count: nextCount })
      .eq("id", pkg.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPkg({
      ...pkg,
      photo_count: nextCount,
    });

    setFiles(null);
    const input = document.getElementById("package-photo-input") as HTMLInputElement | null;
    if (input) input.value = "";

    setSuccess("Photos uploaded successfully");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="text-xl font-semibold">Loading package...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Package Photos
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Upload Photos
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Tracking Code: {pkg?.tracking_code || codeParam}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Current Photo Count
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#F5C84B]">
            {pkg?.photo_count ?? 0}
          </p>
        </div>

        <form onSubmit={handleUpload} className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Select Photos
            </label>
            <input
              id="package-photo-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFiles(e.target.files)
              }
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-[#F5C84B] file:px-4 file:py-2 file:font-bold file:text-black"
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
              {saving ? "Uploading..." : "Upload Photos"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/packages")}
              className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
            >
              Back to Packages
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
