import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

function getStatusStep(status: string) {
  const s = (status || "").toUpperCase();

  if (s === "DELIVERED") return 4;
  if (s === "OUT FOR DELIVERY" || s === "OUT_FOR_DELIVERY") return 3;
  if (s === "IN TRANSIT" || s === "IN_TRANSIT") return 2;
  return 1;
}

function Step({
  title,
  icon,
  active,
  done,
}: {
  title: string;
  icon: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border text-2xl font-bold ${
          done || active
            ? "border-[#F5C84B] bg-[#F5C84B] text-black shadow-[0_0_30px_rgba(245,200,75,0.35)]"
            : "border-white/15 bg-white/5 text-white/50"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-3 text-sm font-semibold ${
          done || active ? "text-white" : "text-white/50"
        }`}
      >
        {title}
      </p>
    </div>
  );
}

export default async function TrackResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const code = decodeURIComponent(id || "").trim().toUpperCase();

  if (!code) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-4 text-xl text-red-300">Missing tracking code</p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-4 text-xl text-red-300">{error.message}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-4 text-xl text-white/80">Tracking not found</p>
        </div>
      </main>
    );
  }

  const currentStep = getStatusStep(data.status || "RECEIVED");

  let photoUrls: string[] = [];

  const { data: photoList } = await supabase.storage
    .from("package-photos")
    .list(data.tracking_code, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });

  if (photoList && photoList.length > 0) {
    photoUrls = photoList
      .filter((file) => !!file.name)
      .map((file) => {
        const { data: publicUrlData } = supabase.storage
          .from("package-photos")
          .getPublicUrl(`${data.tracking_code}/${file.name}`);

        return publicUrlData.publicUrl;
      });
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-3 text-lg text-white/70">
            Tracking Code: {data.tracking_code}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-4 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Current Status
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#F5C84B]">
            {String(data.status || "").replace(/_/g, " ")}
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <Step
              title="Received"
              icon="📥"
              done={currentStep > 1}
              active={currentStep === 1}
            />
            <Step
              title="In Transit"
              icon="📦"
              done={currentStep > 2}
              active={currentStep === 2}
            />
            <Step
              title="Out for Delivery"
              icon="🚚"
              done={currentStep > 3}
              active={currentStep === 3}
            />
            <Step
              title="Delivered"
              icon="✅"
              done={currentStep > 4}
              active={currentStep === 4}
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">Status</p>
            <p className="mt-3 text-2xl font-bold text-white">
              {String(data.status || "").replace(/_/g, " ")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Tracking Code
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{data.tracking_code}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">Package ID</p>
            <p className="mt-3 break-all text-lg font-semibold text-white">
              {data.id}
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#F5C84B]">Package Photos</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {photoUrls.length} photo{photoUrls.length === 1 ? "" : "s"}
            </span>
          </div>

          {photoUrls.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No package photos uploaded yet.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photoUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:opacity-90"
                >
                  <img
                    src={url}
                    alt={`Package photo ${index + 1}`}
                    className="h-64 w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
