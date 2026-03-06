export default function DashboardTrackingPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard Tracking</h1>

      <form action="/track" method="GET" className="mt-4 flex gap-3 max-w-xl">
        <input
          name="code"
          placeholder="TRI-001"
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button className="rounded-lg bg-black px-4 py-2 text-white">
          Track
        </button>
      </form>
    </main>
  );
}
