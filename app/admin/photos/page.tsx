"use client";

import { useRef, useState } from "react";

type PreviewImage = {
  id: string;
  file: File;
  url: string;
};

export default function AdminPhotosPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [packageCode, setPackageCode] = useState("");

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const next: PreviewImage[] = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      }));

    setImages((prev) => [...prev, ...next]);
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const found = prev.find((img) => img.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((img) => img.id !== id);
    });
  }

  function clearAll() {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-[#2b5cff30] bg-[linear-gradient(180deg,rgba(8,16,34,0.92),rgba(5,9,20,0.96))] p-8 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5c542]">
                Photo Uploads
              </h1>
              <p className="mt-3 text-white/70 text-lg">
                Upload UI only for now. No real storage yet.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white/85">
              Admin Preview
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* Left panel */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">
                Package Reference
              </div>

              <input
                type="text"
                value={packageCode}
                onChange={(e) => setPackageCode(e.target.value)}
                placeholder="Example: TRI-001"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f5c542]/50"
              />

              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-white/55">
                Select Images
              </div>

              <label className="mt-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#f5c542]/30 bg-[#f5c542]/5 px-6 py-8 text-center transition hover:bg-[#f5c542]/10">
                <div className="text-5xl">📸</div>
                <div className="mt-4 text-lg font-semibold text-[#f5c542]">
                  Choose package photos
                </div>
                <div className="mt-2 text-sm text-white/65">
                  JPG, PNG, WEBP — preview only for now
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-2xl bg-[#f5c542] px-4 py-3 font-semibold text-black hover:opacity-90"
                >
                  Add Photos
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
                >
                  Clear All
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm text-white/60">Package Code</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {packageCode.trim() || "Not set"}
                </div>

                <div className="mt-4 text-sm text-white/60">Selected Photos</div>
                <div className="mt-1 text-3xl font-bold text-[#f5c542]">
                  {images.length}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Preview Gallery
                  </div>
                  <div className="mt-2 text-white/70">
                    Review images before real upload is connected.
                  </div>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="mt-6 flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 text-center">
                  <div>
                    <div className="text-5xl">🖼️</div>
                    <div className="mt-4 text-xl font-semibold text-white">
                      No photos selected
                    </div>
                    <div className="mt-2 text-white/60">
                      Add package images to preview them here.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20"
                    >
                      <div className="relative aspect-[4/5]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white hover:bg-black"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="truncate text-sm font-semibold text-white">
                          {img.file.name}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          {(img.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[#f5c542]/20 bg-[#f5c542]/5 p-4 text-sm text-[#f5c542]">
                Next step later: connect these previews to Supabase Storage and
                save them under a real package.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
