import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendApnsNotifications } from "@/lib/apns";

export const runtime = "nodejs";

type PackageRow = {
  id: string;
  user_id: string | null;
  tracking_code: string | null;
};

type TokenRow = {
  token: string | null;
  user_id: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildNotificationBody(codes: string[], status: string) {
  const cleanCodes = uniqueValues(codes);

  if (cleanCodes.length === 0) {
    return `Your shipment status was updated to ${status}.`;
  }

  if (cleanCodes.length <= 3) {
    return `${cleanCodes.join(", ")} status updated to ${status}.`;
  }

  const firstThree = cleanCodes.slice(0, 3).join(", ");
  const remaining = cleanCodes.length - 3;

  return `${firstThree} + ${remaining} more status updated to ${status}.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const packageIds = Array.isArray(body.packageIds)
      ? body.packageIds.map(String)
      : [];

    const status = String(body.status || "");

    if (packageIds.length === 0 || !status) {
      return NextResponse.json(
        { error: "Missing packageIds or status" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    console.log("[package-status-ios-push] started", {
      packageIds,
      status,
    });

    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("id, user_id, tracking_code")
      .in("id", packageIds);

    if (packagesError) {
      throw packagesError;
    }

    const packageRows = (packages || []) as PackageRow[];
    const packagesByUser = new Map<string, PackageRow[]>();

    for (const pkg of packageRows) {
      if (!pkg.user_id) continue;

      const existing = packagesByUser.get(pkg.user_id) || [];
      existing.push(pkg);
      packagesByUser.set(pkg.user_id, existing);
    }

    const userIds = Array.from(packagesByUser.keys());

    console.log("[package-status-ios-push] package users", {
      packageCount: packageRows.length,
      userIds,
    });

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        skipped: true,
        reason: "No package users found",
      });
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("token, user_id")
      .in("user_id", userIds)
      .eq("platform", "ios");

    if (tokenError) {
      throw tokenError;
    }

    const tokensByUser = new Map<string, string[]>();

    for (const row of (tokenRows || []) as TokenRow[]) {
      if (!row.user_id || !row.token) continue;

      const existing = tokensByUser.get(row.user_id) || [];
      existing.push(row.token);
      tokensByUser.set(row.user_id, existing);
    }

    const notifications = [];

    for (const userId of userIds) {
      const userTokens = uniqueValues(tokensByUser.get(userId) || []);
      const userPackages = packagesByUser.get(userId) || [];

      if (userTokens.length === 0 || userPackages.length === 0) continue;

      const trackingCodes = userPackages
        .map((pkg) => pkg.tracking_code || "")
        .filter(Boolean);

      const notificationBody = buildNotificationBody(trackingCodes, status);

      for (const token of userTokens) {
        notifications.push({
          token,
          title: "TRI Shipping",
          body: notificationBody,
          data: {
            type: "package_status_update",
            status,
            package_ids: userPackages.map((pkg) => pkg.id).join(","),
            tracking_codes: trackingCodes.join(","),
            url: "/dashboard",
          },
        });
      }
    }

    console.log("[package-status-ios-push] ios tokens", {
      tokenCount: notifications.length,
      usersWithTokens: tokensByUser.size,
    });

    if (notifications.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        skipped: true,
        reason: "No iOS tokens found",
      });
    }

    const apnsResult = await sendApnsNotifications(notifications);

    const failures = apnsResult.results
      .filter((result) => !result.success)
      .map((result) => ({
        token: result.token,
        status: result.status,
        reason: result.reason,
      }));

    console.log("[package-status-ios-push] APNs result", {
      sent: apnsResult.successCount,
      failed: apnsResult.failureCount,
      failures,
    });

    return NextResponse.json({
      success: apnsResult.successCount > 0,
      sent: apnsResult.successCount,
      failed: apnsResult.failureCount,
      failures,
    });
  } catch (error) {
    console.error("[package-status-ios-push] failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Apple iOS push failed",
      },
      { status: 500 }
    );
  }
}
