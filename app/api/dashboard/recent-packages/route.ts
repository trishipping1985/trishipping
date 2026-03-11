import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to load recent packages" },
      { status: 500 }
    )
  }
}
