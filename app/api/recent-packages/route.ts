import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = String(url.searchParams.get("userId") || "").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, role, warehouse_id")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    const me = currentUser as UserRow | null;
    if (!me) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const role = String(me.role || "").trim().toLowerCase();
    const warehouseId = me.warehouse_id || null;

    let query = supabase
      .from("packages")
      .select(`
        id,
        tracking_code,
        status,
        created_at,
        user_id,
        users (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    if (role === "admin" || role === "owner") {
      // no extra filter
    } else if (
      (role === "staff" || role === "staff2" || role === "staff4") &&
      warehouseId
    ) {
      query = query.eq("warehouse_id", warehouseId);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
