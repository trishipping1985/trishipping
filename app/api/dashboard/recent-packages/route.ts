import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("id, tracking_code, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(5)

    if (packagesError) {
      console.error("Recent packages query error:", packagesError)
      return NextResponse.json({ error: packagesError.message }, { status: 500 })
    }

    const userIds = [...new Set((packages || []).map((pkg) => pkg.user_id).filter(Boolean))]

    let usersMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", userIds)

      if (usersError) {
        console.error("Users query error:", usersError)
        return NextResponse.json({ error: usersError.message }, { status: 500 })
      }

      usersMap = Object.fromEntries(
        (users || []).map((user) => [user.id, user.full_name || "-"])
      )
    }

    const formatted = (packages || []).map((pkg) => ({
      id: pkg.id,
      tracking_code: pkg.tracking_code,
      status: pkg.status,
      created_at: pkg.created_at,
      customer_name: pkg.user_id ? usersMap[pkg.user_id] || "-" : "-",
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Recent packages route error:", error)
    return NextResponse.json(
      { error: "Failed to load recent packages" },
      { status: 500 }
    )
  }
}
