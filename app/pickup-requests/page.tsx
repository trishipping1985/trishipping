"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const emptyForm = {
  sender_name: "",
  sender_phone: "",
  sender_address: "",
  sender_country: "",
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  receiver_country: "",
  package_description: "",
  package_count: "1",
  weight_kg: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  requested_pickup_date: "",
  notes: "",
};

type FormData = typeof emptyForm;
type FieldName = keyof FormData;

type Field = {
  name: FieldName;
  label: string;
  required?: boolean;
  type?: string;
};

const sections: {
  title: string;
  subtitle: string;
  fields: Field[];
}[] = [
  {
    title: "Sender Information",
    subtitle: "Where should we collect the shipment?",
    fields: [
      { name: "sender_name", label: "Sender Full Name", required: true },
      {
        name: "sender_phone",
        label: "Sender Phone Number",
        type: "tel",
        required: true,
      },
      {
        name: "sender_address",
        label: "Complete Pickup Address",
        required: true,
      },
      { name: "sender_country", label: "Pickup Country", required: true },
    ],
  },
  {
    title: "Receiver Information",
    subtitle: "Where should the shipment be delivered?",
    fields: [
      { name: "receiver_name", label: "Receiver Full Name", required: true },
      {
        name: "receiver_phone",
        label: "Receiver Phone Number",
        type: "tel",
        required: true,
      },
      {
        name: "receiver_address",
        label: "Complete Delivery Address",
        required: true,
      },
      {
        name: "receiver_country",
        label: "Destination Country",
        required: true,
      },
    ],
  },
  {
    title: "Package Information",
    subtitle: "Provide shipment details",
    fields: [
      { name: "package_description", label: "Package Contents" },
      {
        name: "package_count",
        label: "Number of Packages",
        type: "number",
        required: true,
      },
      { name: "weight_kg", label: "Total Weight (KG)", type: "number" },
      { name: "length_cm", label: "Length (CM)", type: "number" },
      { name: "width_cm", label: "Width (CM)", type: "number" },
      { name: "height_cm", label: "Height (CM)", type: "number" },
      {
        name: "requested_pickup_date",
        label: "Preferred Pickup Date",
        type: "date",
      },
    ],
  },
];

const optionalNumber = (value: string) =>
  value.trim() ? Number(value) : null;

export default function PickupRequestsPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [router]);

  function updateField(name: FieldName, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitPickup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: authError } = await supabase.auth.getUser();

      if (authError || !data.user) {
        throw new Error("Please log in again.");
      }

      const count = Number(form.package_count);

      if (!Number.isInteger(count) || count < 1) {
        throw new Error("Number of packages must be at least 1.");
      }

      const numericFields = [
        "weight_kg",
        "length_cm",
        "width_cm",
        "height_cm",
      ] as const;

      for (const key of numericFields) {
        if (
          form[key].trim() &&
          (!Number.isFinite(Number(form[key])) || Number(form[key]) <= 0)
        ) {
          throw new Error(
            "Weight and dimensions must be greater than zero."
          );
        }
      }

      const requiredFields = [
        "sender_name",
        "sender_phone",
        "sender_address",
        "sender_country",
        "receiver_name",
        "receiver_phone",
        "receiver_address",
        "receiver_country",
      ] as const;

      for (const key of requiredFields) {
        if (!form[key].trim()) {
          throw new Error("Please fill in all required fields.");
        }
      }

      const { data: pickup, error: insertError } = await supabase
        .from("pickup_requests")
        .insert({
          customer_id: data.user.id,
          sender_name: form.sender_name.trim(),
          sender_phone: form.sender_phone.trim(),
          sender_address: form.sender_address.trim(),
          sender_country: form.sender_country.trim(),
          receiver_name: form.receiver_name.trim(),
          receiver_phone: form.receiver_phone.trim(),
          receiver_address: form.receiver_address.trim(),
          receiver_country: form.receiver_country.trim(),
          package_description: form.package_description.trim() || null,
          package_count: count,
          weight_kg: optionalNumber(form.weight_kg),
          length_cm: optionalNumber(form.length_cm),
          width_cm: optionalNumber(form.width_cm),
          height_cm: optionalNumber(form.height_cm),
          requested_pickup_date: form.requested_pickup_date || null,
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (!pickup) {
        throw new Error("Pickup confirmation was not returned.");
      }

      const reference = "TRI-PU-" + String(pickup.id).padStart(6, "0");

      setSuccess(
        `Pickup request submitted successfully! Reference: ${reference}`
      );

      setForm({ ...emptyForm });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit pickup request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Checking your TRI Shipping account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-900 p-7 text-white shadow-2xl ring-1 ring-white/10 sm:p-10">
          <div className="mb-5 inline-block rounded-full border border-amber-400/40 bg-white/5 px-4 py-2 text-xs font-bold tracking-widest text-amber-400">
            TRI SHIPPING
          </div>

          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Pickup Request
          </h1>

          <p className="mt-3 font-semibold text-amber-400">
            Where Luxury Meets Logistics
          </p>

          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">
            Arrange your shipment pickup with TRI Shipping. Complete the
            information below and our team will review your request.
          </p>
        </header>

        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-300 bg-green-50 p-5 font-semibold text-green-800 shadow-sm"
          >
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-300 bg-red-50 p-5 font-semibold text-red-700 shadow-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={submitPickup} className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 font-bold text-amber-400">
                    {index + 1}
                  </span>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {section.title}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {section.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const packageCount = field.name === "package_count";
                  const numeric = field.type === "number";

                  return (
                    <label key={field.name} className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </span>

                      <input
                        type={field.type || "text"}
                        required={field.required}
                        value={form[field.name]}
                        min={
                          packageCount ? "1" : numeric ? "0.01" : undefined
                        }
                        step={
                          packageCount ? "1" : numeric ? "any" : undefined
                        }
                        onChange={(e) =>
                          updateField(field.name, e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 font-bold text-amber-400">
                  4
                </span>

                <h2 className="text-lg font-bold text-slate-900">
                  Additional Instructions
                </h2>
              </div>
            </div>

            <div className="p-6">
              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Special pickup instructions, building details, or other information..."
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-900 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting Pickup Request..."
                : "Submit Pickup Request"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Submitting a request does not confirm your pickup. TRI Shipping
              will review and schedule your collection.
            </p>
          </section>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-sm font-bold text-white">TRI SHIPPING</p>
          <p className="mt-1 text-xs text-amber-400">
            Where Luxury Meets Logistics
          </p>
          <p className="mt-3 text-xs text-slate-400">
            © TRI Shipping. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}