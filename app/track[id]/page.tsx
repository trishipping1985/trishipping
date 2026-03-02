export default function TrackPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Tracking</h1>
      <p className="mt-2 text-white/60 text-sm">ID: {params.id}</p>

      <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 p-6">
        <div className="text-sm font-semibold">Status</div>
        <div className="mt-2 text-white/70">Received at warehouse (demo)</div>
      </div>
    </main>
  );
}
