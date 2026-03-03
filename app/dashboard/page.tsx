import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">Overview</h1>
        <p className="text-white/60 mt-2">
          Welcome to your TRI Shipping dashboard.
        </p>
      </div>

      {/* Stats Row */}
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

      {/* Admin Section */}
      <div className="mt-10">
        <Link
          href="/admin/packages"
          className="
            block
            bg-gradient-to-r from-yellow-500 to-yellow-400
            text-black
            font-semibold
            px-6 py-4
            rounded-xl
            shadow-lg
            hover:scale-[1.02]
            transition-all
            text-center
          "
        >
          👑 Go to Admin Panel
        </Link>
      </div>
    </div>
  );
}
