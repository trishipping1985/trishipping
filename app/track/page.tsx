import { redirect } from "next/navigation"
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
  const code = (searchParams.code || "").trim()

  // No code: show input form (server-only, no use client)
  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white px-4">
        <div className="w-full max-w-xl rounded-2xl border border-[#1b2b52] bg-[#0f1b36] p-8 shadow-xl">
          <h1 className="text-4xl font-extrabold text-yellow-400">Tracking</h1>
          <p className="mt-3 text-red-300">Missing tracking code</p>

          <form
            className="mt-6 flex gap-3"
            action="/track"
            method="GET"
          >
            <input
              name="code"
              placeholder="Enter tracking code (e.g. TRI-001)"
              className="flex-1 rounded-xl bg-[#0b1426] border border-[#223a72] px-4 py-3 outline-none focus:border-yellow-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300"
            >
              Track
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Lookup package
  const { data, error } = await supabase
    .from("packages")
    .select("id,user_id,tracking_code,status,created_at")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white px-4">
        <div className="w-full max-w-xl rounded-2xl border border-[#1b2b52] bg-[#0f1b36] p-8 shadow-xl text-center">
          <h1 className="text-4xl font-extrabold text-yellow-400">Tracking</h1>
          <p className="mt-3 text-red-300">Shipment not found for: {code}</p>
          <a
            href="/track"
            className="inline-block mt-6 rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1b2b52] bg-[#0f1b36] p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-yellow-400">Tracking</h1>
          <p className="mt-2 text-sm text-gray-300">Tracking code: {data.tracking_code}</p>
          <h2 className="mt-6 text-3xl font-bold text-white">Shipment Found ✅</h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#0b1426] border border-[#223a72] p-5">
            <div className="text-sm text-gray-300">Status</div>
            <div className="mt-1 text-xl font-semibold">{data.status}</div>
          </div>

          <div className="rounded-xl bg-[#0b1426] border border-[#223a72] p-5">
            <div className="text-sm text-gray-300">Created</div>
            <div className="mt-1 text-xl font-semibold">
              {new Date(data.created_at).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl bg-[#0b1426] border border-[#223a72] p-5 sm:col-span-2">
            <div className="text-sm text-gray-300">Package ID</div>
            <div className="mt-1 font-mono text-sm break-all">{data.id}</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/track"
            className="inline-block rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Track another shipment
          </a>
        </div>
      </div>
    </div>
  )
}
