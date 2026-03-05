import { redirect } from "next/navigation";

async function trackAction(formData: FormData) {
  "use server";

  const raw = String(formData.get("code") || "").trim();
  const code = raw.toUpperCase();

  if (!code) {
    redirect("/track?error=missing");
  }

  redirect(`/track/${encodeURIComponent(code)}`);
}

export default function TrackEntryPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMsg =
    searchParams?.error === "missing" ? "Missing tracking code" : "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#071427] px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-[#F5C84B]">Tracking</h1>

        <p className="mt-2 text-white/70">
          Enter your tracking code to view shipment status.
        </p>

        {errorMsg ? (
          <p className="mt-4 text-red-300 font-semibold">{errorMsg}</p>
        ) : null}

        <form action={trackAction} className="mt-6 flex gap-3">
          <input
            name="code"
            placeholder="Enter tracking code (e.g. TRI-001)"
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#F5C84B]/60"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
          >
            Track
          </button>
        </form>
      </div>
    </main>
  );
}
