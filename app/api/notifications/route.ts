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
    const user_id = String(body?.user_id || "").trim() || null;
    const status = String(body?.status || "").trim().toUpperCase();

    if (!tracking_code || !status) {
      return NextResponse.json(
        { error: "Missing tracking code or status" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    const title = "Shipment Status Updated";
    const message = `Your package ${tracking_code} is now ${status}.`;
    const type = "status";
    const link = `/track/${encodeURIComponent(tracking_code)}`;

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type,
        tracking_code,
        link,
        is_read: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications route error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}