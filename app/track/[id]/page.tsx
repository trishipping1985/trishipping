import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function TrackResultPage({
  params,
}: {
  params: { id: string };
}) {
  const code = decodeURIComponent(params.id || "").trim().toUpperCase();

  if (!code) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Tracking</h1>
        <p>Missing tracking code</p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Tracking</h1>
        <p>Error: {error.message}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Tracking</h1>
        <p>Tracking not found</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Tracking</h1>
      <p>Status: {data.status}</p>
      <p>Tracking Code: {data.tracking_code}</p>
      <p>Package ID: {data.id}</p>
    </main>
  );
}
