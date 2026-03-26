import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon() {
  const logoPath = path.join(process.cwd(), "public", "LOGOTRI.jpeg");
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <img
          src={logoSrc}
          alt="TRI Shipping"
          style={{
            width: "78%",
            height: "78%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}