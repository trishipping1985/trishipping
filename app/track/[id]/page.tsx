import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TrackPage({
  params,
}: {
  params: { id: string };
}) {
  const trackingCode = params.id;

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", trackingCode)
    .single();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">
            Tracking Not Found
          </h1>
          <p className="text-gray-400">
            No shipment was found for tracking code: {trackingCode}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-10 rounded-xl border border-gray-700 text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">
          Shipment Status
        </h1>

        <p className="text-gray-400 mb-2">Tracking Code</p>
        <p className="text-xl font-bold mb-6">{data.tracking_code}</p>

        <p className="text-gray-400 mb-2">Status</p>
        <p className="text-2xl text-yellow-400 font-bold">
          {data.status}
        </p>
      </div>
    </div>
  );
}
