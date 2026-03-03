export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">Overview</h1>
        <p className="text-white/60 mt-2">
          Welcome to your TRI Shipping dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] p-6 rounded-xl border border-white/10">
          <div className="text-white/60 text-sm">Packages</div>
          <div className="text-3xl font-bold mt-2">0</div>
        </div>

        <div className="bg-[#111827] p-6 rounded-xl border border-white/10">
          <div className="text-white/60 text-sm">In Transit</div>
          <div className="text-3xl font-bold mt-2">0</div>
        </div>

        <div className="bg-[#111827] p-6 rounded-xl border border-white/10">
          <div className="text-white/60 text-sm">Delivered</div>
          <div className="text-3xl font-bold mt-2">0</div>
        </div>
      </div>

      <div className="bg-[#111827] p-6 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Next steps</h2>
        <ul className="list-disc pl-5 space-y-2 text-white/70">
          <li>Create packages list page</li>
          <li>Connect tracking timeline to Supabase</li>
          <li>Add profile page</li>
        </ul>
      </div>
    </div>
  );
}
