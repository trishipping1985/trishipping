import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      user_id,
      tracking_code,
      status,
      notes,
      weight_kg
    } = body;

    if (!user_id || !tracking_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cleanTracking = tracking_code.trim().toUpperCase();

    /* ------------------------------
       CREATE PACKAGE
    ------------------------------ */

    const { data: pkg, error: packageError } = await supabase
      .from("packages")
      .insert({
        user_id,
        tracking_code: cleanTracking,
        status,
        notes,
        weight_kg: weight_kg || null
      })
      .select()
      .single();

    if (packageError) {
      return NextResponse.json(
        { error: packageError.message },
        { status: 500 }
      );
    }

    /* ------------------------------
       AUTO CREATE FIRST EVENT
    ------------------------------ */

    const firstNote =
      notes && notes.trim()
        ? notes.trim()
        : "Package received at warehouse";

    const { error: eventError } = await supabase
      .from("package_events")
      .insert({
        tracking_code: cleanTracking,
        status: status || "RECEIVED",
        location: "Warehouse",
        note: firstNote
      });

    if (eventError) {
      console.error("Event creation failed:", eventError.message);
    }

    return NextResponse.json({
      success: true,
      package: pkg
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
