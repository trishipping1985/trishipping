import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user_id = String(body?.user_id || "").trim();
    const tracking_code = String(body?.tracking_code || "").trim().toUpperCase();
    const status = String(body?.status || "RECEIVED").trim().toUpperCase();
    const notes = String(body?.notes || "").trim();
    const rawWeight = String(body?.weight_kg || "").trim();

    if (!user_id || !tracking_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const weight_kg =
      rawWeight === "" || Number.isNaN(Number(rawWeight))
        ? null
        : Number(rawWeight);

    const { data: pkg, error: packageError } = await supabase
      .from("packages")
      .insert({
        user_id,
        tracking_code,
        status,
        notes: notes || null,
        weight_kg,
      })
      .select()
      .single();

    if (packageError) {
      return NextResponse.json(
        { error: packageError.message },
        { status: 500 }
      );
    }

    const firstNote = notes || "Package received at warehouse";

    const { error: eventError } = await supabase
      .from("package_events")
      .insert({
        package_id: pkg.id,
        tracking_code,
        status: status || "RECEIVED",
        location: "Warehouse",
        note: firstNote,
      });

    if (eventError) {
      return NextResponse.json(
        { error: `Package created but first event failed: ${eventError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
