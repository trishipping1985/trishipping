import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("packages")
      .select(`
        id,
        tracking_number,
        status,
        created_at,
        customer_name,
        customer_email
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Recent packages query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Recent packages route error:", error)
    return NextResponse.json(
      { error: "Failed to load recent packages" },
      { status: 500 }
    )
  }
}
