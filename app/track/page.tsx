import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function TrackPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Tracking</h1>
          <p className="mt-4 text-red-400">Missing tracking code</p>
        </div>
      </div>
    )
  }

  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", code)
    .single()

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Tracking</h1>
          <p className="mt-4 text-red-400">Shipment not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white">
      <div className="bg-[#111C3A] p-10 rounded-xl border border-yellow-500 text-center">
        <h1 className="text-4xl font-bold text-yellow-400">Tracking</h1>
        <p className="mt-6 text-xl">Tracking Code: {data.tracking_code}</p>
        <p className="mt-2">Status: {data.status}</p>
        <p className="mt-2">Created: {new Date(data.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}
