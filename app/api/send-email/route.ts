import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailBody = {
  to: string;
  subject: string;
  trackingCode?: string;
  status?: string;
  customerName?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendEmailBody;

    const to = String(body.to || "").trim();
    const subject = String(body.subject || "").trim();
    const trackingCode = String(body.trackingCode || "").trim();
    const status = String(body.status || "").trim();
    const customerName = String(body.customerName || "").trim();
    const customMessage = String(body.message || "").trim();

    if (!to) {
      return Response.json(
        { error: "Recipient email is required." },
        { status: 400 }
      );
    }

    if (!subject) {
      return Response.json(
        { error: "Email subject is required." },
        { status: 400 }
      );
    }

    const safeCustomerName = customerName || "Customer";
    const safeMessage =
      customMessage ||
      (trackingCode && status
        ? `Your package ${trackingCode} is now ${status}.`
        : "You have a new shipment update.");

    const trackingUrl = trackingCode
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track/${encodeURIComponent(trackingCode)}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/notifications`;

    const { data, error } = await resend.emails.send({
      from: "TRI Shipping <notifications@trishipping.com>",
      to: [to],
      subject,
      html: `
        <div style="margin:0;padding:0;background:#071427;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background:#0b1830;border:1px solid rgba(245,200,75,0.18);border-radius:20px;padding:32px;">
              <div style="font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#f5c84b;opacity:0.9;margin-bottom:12px;">
                TRI Shipping
              </div>

              <h1 style="margin:0 0 16px 0;font-size:32px;line-height:1.2;color:#f5c84b;">
                Shipment Update
              </h1>

              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#e5e7eb;">
                Hello ${safeCustomerName},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#e5e7eb;">
                ${safeMessage}
              </p>

              ${
                trackingCode
                  ? `
              <div style="margin:0 0 20px 0;padding:16px 18px;background:#071427;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">
                  Tracking Code
                </div>
                <div style="font-size:24px;font-weight:700;color:#f5c84b;">
                  ${trackingCode}
                </div>
                ${
                  status
                    ? `
                <div style="margin-top:12px;font-size:14px;color:#d1d5db;">
                  Current status: <strong style="color:#ffffff;">${status}</strong>
                </div>
                `
                    : ""
                }
              </div>
              `
                  : ""
              }

              <div style="margin-top:28px;">
                <a
                  href="${trackingUrl}"
                  style="display:inline-block;background:#f5c84b;color:#071427;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;"
                >
                  Track Shipment
                </a>
              </div>

              <p style="margin:28px 0 0 0;font-size:13px;line-height:1.7;color:#9ca3af;">
                This is an automated notification from TRI Shipping.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("send-email route error:", error);

    return Response.json(
      { error: "Failed to send email." },
      { status: 500 }
    );
  }
}
