import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type UserRow = {
  id: string;
  warehouse_id: string | null;
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user_id = String(body?.user_id || "").trim();
    const selectedWarehouseId = String(body?.warehouse_id || "").trim();
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

    if (selectedWarehouseId && !isValidUuid(selectedWarehouseId)) {
      return NextResponse.json(
        { error: "Invalid warehouse selected." },
        { status: 400 }
      );
    }

    const weight_kg =
      rawWeight === "" || Number.isNaN(Number(rawWeight))
        ? null
        : Number(rawWeight);

    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, warehouse_id")
      .eq("id", user_id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const userRow = targetUser as UserRow;
    let warehouse_id = userRow.warehouse_id || null;

    if (selectedWarehouseId) {
      const { data: warehouseData, error: warehouseError } = await supabase
        .from("warehouses")
        .select("id")
        .eq("id", selectedWarehouseId)
        .maybeSingle();

      if (warehouseError) {
        return NextResponse.json(
          { error: warehouseError.message },
          { status: 500 }
        );
      }

      if (!warehouseData) {
        return NextResponse.json(
          { error: "Selected warehouse was not found." },
          { status: 400 }
        );
      }

      warehouse_id = selectedWarehouseId;
    }

    const { data: pkg, error: packageError } = await supabase
      .from("packages")
      .insert({
        user_id,
        warehouse_id,
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
        {
          error: `Package created but first event failed: ${eventError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}