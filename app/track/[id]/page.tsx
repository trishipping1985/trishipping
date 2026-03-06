import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TrackPage({
  params,
}: {
  params: { id: string };
}) {
  const code = params.id.toUpperCase();

  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", code)
    .maybeSingle();

  if (!data) {
    return <div style={{ padding: 40 }}>Tracking not found</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Tracking</h1>
      <p>Status: {data.status}</p>
      <p>Tracking Code: {data.tracking_code}</p>
    </div>
  );
}
