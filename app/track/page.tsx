"use client";

import { useState } from "react";

export default function TrackPage() {
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const clean = code.trim().toUpperCase();
    if (!clean) return;

    window.location.href = `/track/${clean}`;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Tracking</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCode(e.target.value)
          }
          placeholder="TRI-001"
        />
        <button type="submit">Track</button>
      </form>
    </main>
  );
}
