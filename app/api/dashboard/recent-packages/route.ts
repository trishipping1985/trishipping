import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("packages")
      .select(`
        id,
        tracking_code,
        status,
        created_at,
        user_id,
        users:user_id (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Recent packages query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formatted =
      data?.map((pkg: any) => ({
        id: pkg.id,
        tracking_code: pkg.tracking_code,
        status: pkg.status,
        created_at: pkg.created_at,
        customer_name: pkg.users?.full_name || "-",
      })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Recent packages route error:", error)
    return NextResponse.json(
      { error: "Failed to load recent packages" },
      { status: 500 }
    )
  }
}
