"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UploadedItem = {
  name: string;
  path: string;
  url: string;
};

export default function DashboardPhotosPage() {
  const [trackingCode, setTrackingCode] = useState("TRI-001");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedItem[]>([]);
  const [error, setError] = useState<string>("");

  const canUpload = useMemo(() => {
    return !!trackingCode.trim() && files.length > 0 && !uploading;
  }, [trackingCode, files.length, uploading]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const list = Array.from(e.target.files || []);
    setFiles(list);
  }

  function safeExt(name: string) {
    const parts = name.split(".");
    if (parts.length < 2) return "jpg";
    const ext = parts.pop()!.toLowerCase();
    return ext.replace(/[^a-z0-9]/g, "") || "jpg";
  }

  function makeObjectPath(file: File) {
    const tc = trackingCode.trim().toUpperCase();
    const ext = safeExt(file.name);
    const rand = Math.random().toString(36).slice(2, 8);
    const ts = Date.now();
    return `${tc}/${ts}-${rand}.${ext}`;
  }

  async function handleUpload() {
    setError("");
    if (!trackingCode.trim()) return setError("Tracking code is required.");
    if (files.length === 0) return setError("Pick at least 1 photo.");

    setUploading(true);
    try {
      const bucket = "package-photos";
      const results: UploadedItem[] = [];

      for (const file of files) {
        const path = makeObjectPath(file);

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/jpeg",
          });

        if (upErr) throw upErr;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        results.push({
          name: file.name,
          path,
          url: data.publicUrl,
        });
      }

      setUploaded((prev) => [...results, ...prev]);
      setFiles([]);
      const input = document.getElementById("photo-input") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e: any) {
      setError(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-yellow-400">Package Photos</h1>
        <p className="text-white/70 mt-2">
          Upload photos to Supabase Storage (no database yet).
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-sm text-white/70 mb-2">
              Tracking code (folder name)
            </label>
            <input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="TRI-001"
              className="w-full rounded-xl bg-[#0b1220] border border-white/10 px-4 py-3 outline-none focus:border-yellow-400/60"
            />
            <p className="text-xs text-white/50 mt-2">
              Files will be saved under: <span className="text-white/70">{trackingCode.trim() || "TRI-XXX"}/...</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70 mb-2">Select photos</label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="w-full rounded-xl bg-[#0b1220] border border-white/10 px-4 py-3"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>

              <div className="text-sm text-white/70">
                {files.length > 0 ? `${files.length} file(s) selected` : "No files selected"}
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Uploaded</h2>
          <span className="text-sm text-white/60">{uploaded.length} file(s)</span>
        </div>

        {uploaded.length === 0 ? (
          <div className="mt-4 text-white/60">No uploads yet.</div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploaded.map((u) => (
              <a
                key={u.path}
                href={u.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-white/10 bg-[#0b1220] overflow-hidden hover:border-yellow-400/30 transition"
              >
                <div className="aspect-[4/3] bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.url}
                    alt={u.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm text-white/80 truncate">{u.name}</div>
                  <div className="text-xs text-white/50 truncate mt-1">{u.path}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
