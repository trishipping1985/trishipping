import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tracking_code = String(body?.tracking_code || "").trim().toUpperCase();
    const user_id = body?.user_id || null;
    const status = String(body?.status || "").trim().toUpperCase();

    if (!tracking_code || !status) {
      return NextResponse.json(
        { error: "Missing tracking code or status" },
        { status: 400 }
      );
    }

    const message = `Shipment ${tracking_code} status updated to ${status}`;

    const { error } = await supabase
      .from("notifications")
      .upsert(
        {
          tracking_code,
          user_id,
          message,
          status,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "tracking_code",
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
