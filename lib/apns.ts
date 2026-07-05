import crypto from "crypto";
import http2 from "http2";

type ApnsSendInput = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null | undefined>;
};

type ApnsSendResult = {
  token: string;
  success: boolean;
  status?: number;
  reason?: string;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getApnsJwt() {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;

  if (!keyId || !teamId || !privateKey) {
    throw new Error("Missing APNs env vars: APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY");
  }

  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = privateKey.replace(/\\n/g, "\n");

  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64Url(signature)}`;
}

export async function sendApnsNotifications(
  notifications: ApnsSendInput[]
): Promise<{
  successCount: number;
  failureCount: number;
  results: ApnsSendResult[];
}> {
  const bundleId = process.env.APNS_BUNDLE_ID || "info.trishipping.twa";
  const env = process.env.APNS_ENV || "production";
  const host =
    env === "development"
      ? "https://api.sandbox.push.apple.com"
      : "https://api.push.apple.com";

  const jwt = getApnsJwt();

  const client = http2.connect(host);

  const results: ApnsSendResult[] = [];

  try {
    for (const item of notifications) {
      const payload = JSON.stringify({
        aps: {
          alert: {
            title: item.title,
            body: item.body,
          },
          sound: "default",
        },
        ...(item.data || {}),
      });

      const result = await new Promise<ApnsSendResult>((resolve) => {
        const req = client.request({
          ":method": "POST",
          ":path": `/3/device/${item.token}`,
          authorization: `bearer ${jwt}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        });

        let responseBody = "";
        let status = 0;

        req.setEncoding("utf8");

        req.on("response", (headers) => {
          status = Number(headers[":status"] || 0);
        });

        req.on("data", (chunk) => {
          responseBody += chunk;
        });

        req.on("end", () => {
          if (status >= 200 && status < 300) {
            resolve({
              token: item.token,
              success: true,
              status,
            });
            return;
          }

          let reason = responseBody || `APNs error status ${status}`;

          try {
            const parsed = JSON.parse(responseBody);
            reason = parsed.reason || reason;
          } catch {
            // Keep raw APNs response.
          }

          resolve({
            token: item.token,
            success: false,
            status,
            reason,
          });
        });

        req.on("error", (error) => {
          resolve({
            token: item.token,
            success: false,
            reason: error instanceof Error ? error.message : String(error),
          });
        });

        req.end(payload);
      });

      results.push(result);
    }
  } finally {
    client.close();
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  return {
    successCount,
    failureCount,
    results,
  };
}
