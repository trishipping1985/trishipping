import { redirect } from "next/navigation";

async function dashTrackAction(formData: FormData) {
  "use server";

  const raw = String(formData.get("code") || "").trim();
  const code = raw.toUpperCase();

  if (!code) redirect("/track?error=missing");
  redirect(`/track/${encodeURIComponent(code)}`);
}

export default function DashboardTrackingPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard Tracking</h1>

      <form action={dashTrackAction} className="mt-4 flex gap-3 max-w-xl">
        <input
          name="code"
          placeholder="TRI-001"
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button className="rounded-lg bg-black text-white px-4 py-2">
          Track
        </button>
      </form>
    </main>
  );
}
