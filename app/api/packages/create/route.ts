import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user_id = String(body.user_id || "").trim();
    const tracking_code = String(body.tracking_code || "").trim().toUpperCase();
    const status = String(body.status || "RECEIVED").trim().toUpperCase();
    const notes = String(body.notes || "").trim();
    const weightRaw = String(body.weight_kg ?? "").trim();

    if (!user_id) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 }
      );
    }

    if (!tracking_code) {
      return NextResponse.json(
        { error: "Tracking code is required" },
        { status: 400 }
      );
    }

    const payload: {
      user_id: string;
      tracking_code: string;
      status: string;
      notes?: string;
      weight_kg?: number;
    } = {
      user_id,
      tracking_code,
      status,
    };

    if (notes) payload.notes = notes;
    if (weightRaw) payload.weight_kg = Number(weightRaw);

    const { data, error } = await supabase
      .from("packages")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, package: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
