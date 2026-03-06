export default function TrackPage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Tracking</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const code = (e.target as any).code.value.trim().toUpperCase();
          if (!code) return;
          window.location.href = `/track/${code}`;
        }}
      >
        <input name="code" placeholder="TRI-001" />
        <button type="submit">Track</button>
      </form>
    </main>
  );
}
