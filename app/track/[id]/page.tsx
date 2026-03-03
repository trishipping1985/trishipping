import { getSupabase } from "@/lib/supabaseClient";

export default async function TrackResultPage({
  params,
}: {
  params: { id: string };
}) {
  const trackingCode = decodeURIComponent(params.id || "").trim().toUpperCase();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", trackingCode);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <pre>{JSON.stringify({ trackingCode, data, error }, null, 2)}</pre>
    </main>
  );
}
