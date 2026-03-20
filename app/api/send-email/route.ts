import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeCustomerName(name: string) {
  const raw = String(name || "").trim();
  if (!raw) return "Valued Client";

  const cleaned = raw.replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();

  const blockedValues = [
    "customer",
    "valued customer",
    "valued client",
    "tri shipping",
    "info@trishipping.info",
  ];

  if (blockedValues.includes(lower)) {
    return "Valued Client";
  }

  const words = cleaned.split(" ");
  if (words.length >= 2) {
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    if (uniqueWords.size === 1) {
      return "Valued Client";
    }
  }

  if (cleaned.length < 2) {
    return "Valued Client";
  }

  return cleaned;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = String(body?.to || "").trim();
    const subject = String(body?.subject || "Shipment Update").trim();
    const trackingCode = String(body?.trackingCode || "").trim();
    const status = String(body?.status || "").trim();
    const customerName = String(body?.customerName || "").trim();
    const message = String(body?.message || "").trim();

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const safeCustomerName = normalizeCustomerName(customerName);
    const safeTrackingCode = trackingCode || "N/A";
    const safeStatus = status || "N/A";

    const finalSubject = subject || `Shipment Update - ${safeTrackingCode}`;

    const finalMessage =
      message ||
      `We would like to inform you that your shipment ${safeTrackingCode} has been updated to ${safeStatus}.`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${finalSubject}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#0b0f14; font-family:Arial, Helvetica, sans-serif; color:#111827;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
            ${finalMessage}
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0f14; margin:0; padding:32px 14px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px; background-color:#11161d; border:1px solid #222a33; border-radius:24px; overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(180deg, #0f2138 0%, #0b1624 100%); padding:38px 32px 30px; text-align:center; border-bottom:1px solid #1f2937;">
                      <div style="font-size:42px; line-height:1.1; font-weight:700; color:#d4af37; letter-spacing:0.6px;">
                        TRI Shipping
                      </div>
                      <div style="margin-top:12px; font-size:14px; line-height:1.7; color:#c5ccd6; letter-spacing:0.4px;">
                        Premium shipment updates with clarity, reliability, and care
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:38px 34px 12px; background-color:#11161d;">
                      <div style="font-size:12px; line-height:1.4; font-weight:700; letter-spacing:2.4px; color:#d4af37; text-transform:uppercase; margin-bottom:18px;">
                        Shipment Update
                      </div>

                      <div style="font-size:30px; line-height:1.35; font-weight:700; color:#f8fafc; margin-bottom:18px;">
                        Dear ${safeCustomerName},
                      </div>

                      <div style="font-size:16px; line-height:1.85; color:#d6dbe2;">
                        ${finalMessage}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:24px 34px 8px; background-color:#11161d;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #27303b; border-radius:20px; background:linear-gradient(180deg, #171d25 0%, #131920 100%);">
                        <tr>
                          <td style="padding:26px 24px;">
                            <div style="font-size:12px; line-height:1.4; font-weight:700; letter-spacing:2px; color:#9ca3af; text-transform:uppercase; margin-bottom:18px;">
                              Shipment Details
                            </div>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="padding:0 0 16px; font-size:16px; line-height:1.7; color:#f3f4f6;">
                                  <span style="font-weight:700; color:#d4af37;">Tracking Code:</span>
                                  <span style="color:#e5e7eb;"> ${safeTrackingCode}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:0; font-size:16px; line-height:1.7; color:#f3f4f6;">
                                  <span style="font-weight:700; color:#d4af37;">Current Status:</span>
                                  <span style="display:inline-block; margin-left:10px; padding:8px 16px; border-radius:999px; background-color:#0f2138; border:1px solid #2b4260; color:#f3d27a; font-size:12px; font-weight:700; letter-spacing:1.3px; text-transform:uppercase;">
                                    ${safeStatus}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:26px 34px 10px; background-color:#11161d;">
                      <div style="font-size:15px; line-height:1.85; color:#c9d1d9;">
                        Thank you for choosing <span style="color:#d4af37; font-weight:700;">TRI Shipping</span>. We remain committed to providing a dependable and professional shipping experience every step of the way.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:28px 34px 34px; background-color:#11161d;">
                      <div style="height:1px; background-color:#27303b; margin-bottom:18px;"></div>
                      <div style="font-size:12px; line-height:1.8; color:#8f98a3;">
                        This is an automated notification from TRI Shipping.
                      </div>
                      <div style="font-size:12px; line-height:1.8; color:#8f98a3;">
                        Please do not reply directly to this email.
                      </div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;">
                  <tr>
                    <td style="padding:16px 10px 0; text-align:center; font-size:11px; line-height:1.7; color:#7b8591;">
                      TRI Shipping · Shipment Notification Service
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "TRI Shipping <no-reply@trishipping.info>",
      to,
      subject: finalSubject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send email route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
