export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4af37]">Overview</h1>
      <p className="mt-2 text-white/65 text-sm">
        Welcome to your TRI Shipping dashboard. Next we’ll connect packages,
        photos, QR labels, and tracking.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Packages" value="0" note="Inbound & consolidated" />
        <Card title="In Transit" value="0" note="Shipped but not delivered" />
        <Card title="Delivered" value="0" note="Completed shipments" />
      </div>

      <div className="mt-6 rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="text-sm font-semibold">Next steps</div>
        <ul className="mt-2 text-sm text-white/65 list-disc pl-5 space-y-1">
          <li>Create packages list page</li>
          <li>Connect tracking timeline to Supabase</li>
          <li>Add profile page (name, phone, address)</li>
        </ul>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
      <div className="text-xs text-white/50">{title}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/50">{note}</div>
    </div>
  );
}
