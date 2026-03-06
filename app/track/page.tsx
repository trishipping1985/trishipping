import { redirect } from "next/navigation";

export default function TrackRedirectPage({
  params,
}: {
  params: { id?: string };
}) {
  const code = decodeURIComponent(params?.id || "").trim();

  if (!code) {
    redirect("/track");
  }

  redirect(`/track?code=${encodeURIComponent(code)}`);
}
