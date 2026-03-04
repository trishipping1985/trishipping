"use client";

import { useEffect, useState } from "react";

export default function TrackPage({
  params,
}: {
  params: { id: string };
}) {
  const trackingCode = params.id;

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/track/${trackingCode}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (data.found) {
          setShipment(data.package);
        }
      } catch (err) {
        console.error("Tracking error:", err);
      }

      setLoading(false);
    }

    fetchTracking();
  }, [trackingCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white">
        <p className="text-gray-400 text-lg">Loading tracking...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            Tracking Not Found
          </h1>

          <p className="text-gray-400">
            No shipment was found for tracking code:
          </p>

          <p className="text-white font-bold mt-2 text-lg">
            {trackingCode}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b1220] text-white">
      <div className="bg-[#111827] p-10 rounded-xl border border-gray-700 w-[420px] text-center">

        <h1 className="text-3xl font-bold text-yellow-400 mb-6">
          Shipment Tracking
        </h1>

        <div className="mb-6">
          <p className="text-gray-400 text-sm">Tracking Code</p>
          <p className="text-xl font-bold">{shipment.tracking_code}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Status</p>
          <p className="text-2xl font-bold text-yellow-400">
            {shipment.status}
          </p>
        </div>

      </div>
    </div>
  );
}
