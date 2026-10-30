"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const initialForm = {
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

type PickupForm = typeof initialForm;
type FieldName = keyof PickupForm;

type Field = {
  name: FieldName;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
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
      {
        name: "sender_name",
        label: "Sender Full Name",
        required: true,
      },
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
      {
        name: "sender_country",
        label: "Pickup Country",
        required: true,
      },
    ],
  },
  {
    title: "Receiver Information",
    subtitle: "Where should the shipment be delivered?",
    fields: [
      {
        name: "receiver_name",
        label: "Receiver Full Name",
        required: true,
      },
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
    subtitle: "Provide your shipment details",
    fields: [
      {
        name: "package_description",
        label: "Package Contents",
        placeholder: "Clothing, cosmetics, electronics...",
      },
      {
        name: "package_count",
        label: "Number of Packages",
        type: "number",
        required: true,
      },
      {
        name: "weight_kg",
        label: "Total Weight (KG)",
        type: "number",
      },
      {
        name: "length_cm",
        label: "Length (CM)",
        type: "number",
      },
      {
        name: "width_cm",
        label: "Width (CM)",
        type: "number",
      },
      {
        name: "height_cm",
        label: "Height (CM)",
        type: "number",
      },
      {
        name: "requested_pickup_date",
        label: "Preferred Pickup Date",
        type: "date",
      },
    ],
  },
];

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export default function PickupRequestsPage() {
  const router = useRouter();

  const [form, setForm] = useState<PickupForm>({
    ...initialForm,
  });

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
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
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submitPickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError || !data.user) {
        throw new Error("Please log in to submit your request.");
      }

      const packageCount = Number(form.package_count);

      if (
        !Number.isInteger(packageCount) ||
        packageCount < 1
      ) {
        throw new Error(
          "Number of packages must be a whole number of 1 or greater."
        );
      }

      const numericFields = [
        "weight_kg",
        "length_cm",
        "width_cm",
        "height_cm",
      ] as const;

      for (const key of numericFields) {
        if (form[key].trim()) {
          const value = Number(form[key]);

          if (!Number.isFinite(value) || value <= 0) {
            throw new Error(
              "Weight and dimensions must be greater than zero."
            );
          }
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
          throw new Error(
            "Please complete all required fields."
          );
        }
      }

      const { data: pickup, error: insertError } =
        await supabase
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

            package_description:
              form.package_description.trim() || null,

            package_count: packageCount,
            weight_kg: optionalNumber(form.weight_kg),
            length_cm: optionalNumber(form.length_cm),
            width_cm: optionalNumber(form.width_cm),
            height_cm: optionalNumber(form.height_cm),

            requested_pickup_date:
              form.requested_pickup_date || null,

            notes: form.notes.trim() || null,
          })
          .select("id")
          .single();

      if (insertError) {
        throw insertError;
      }

      if (!pickup) {
        throw new Error(
          "Pickup confirmation was not returned."
        );
      }

      const reference =
        "TRI-PU-" + String(pickup.id).padStart(6, "0");

      setSuccess(
        `Pickup request submitted successfully! Your reference number is ${reference}.`
      );

      setForm({ ...initialForm });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

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
      <main className="flex min-h-screen items-center justify-center bg-[#050914] px-4 text-white">
        <div className="rounded-2xl border border-[#d4af37]/25 bg-[#101d36] p-8 text-center">
          <h2 className="text-xl font-black text-[#d4af37]">
            TRI SHIPPING
          </h2>

          <p className="mt-3 text-sm text-white/60">
            Checking your secure account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#050914_0%,#071427_45%,#0b2340_100%)] px-4 py-8 text-white sm:px-6 sm:py-12">

      <div className="mx-auto max-w-4xl">

        {/* MAIN HEADER */}

        <header className="mb-8 overflow-hidden rounded-[28px] border border-[#d4af37]/25 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_40%),linear-gradient(135deg,#071427,#102e55)] p-7 shadow-2xl sm:p-10">

          <div className="mb-5 inline-flex items-center rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            TRI SHIPPING
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Pickup Request
          </h1>

          <p className="mt-3 text-sm font-bold text-[#d4af37]">
            Where Luxury Meets Logistics
          </p>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
            Arrange your shipment pickup with TRI Shipping.
            Complete the information below and our team
            will review your collection request.
          </p>

          <div className="mt-6 h-[2px] w-24 rounded-full bg-[#d4af37]" />

        </header>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-sm font-semibold text-green-300"
          >
            {success}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm font-semibold text-red-300"
          >
            {error}
          </div>
        )}

        {/* PICKUP REQUEST FORM */}

        <form
          onSubmit={submitPickup}
          className="space-y-6"
        >

          {sections.map((section, index) => (
            <section
              key={section.title}
              className="overflow-hidden rounded-[24px] border border-[#d4af37]/20 bg-[#0d1c33] shadow-[0_15px_50px_rgba(0,0,0,0.30)]"
            >

              {/* SECTION HEADING */}

              <div className="border-b border-[#d4af37]/15 bg-[#122541] px-6 py-6">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 text-lg font-black text-[#d4af37]">
                    {index + 1}
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-white">
                      {section.title}
                    </h2>

                    <p className="mt-1 text-xs text-white/50">
                      {section.subtitle}
                    </p>
                  </div>

                </div>
              </div>

              {/* INPUT FIELDS */}

              <div className="grid gap-5 p-6 sm:grid-cols-2">

                {section.fields.map((field) => {
                  const isPackageCount =
                    field.name === "package_count";

                  const isNumber =
                    field.type === "number";

                  return (
                    <label
                      key={field.name}
                      className="block"
                    >

                      <span className="mb-2 block text-sm font-semibold text-white/85">
                        {field.label}

                        {field.required && (
                          <span className="ml-1 text-[#d4af37]">
                            *
                          </span>
                        )}
                      </span>

                      <input
                        type={field.type || "text"}
                        required={field.required || false}
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        min={
                          isPackageCount
                            ? "1"
                            : isNumber
                              ? "0.01"
                              : undefined
                        }
                        step={
                          isPackageCount
                            ? "1"
                            : isNumber
                              ? "any"
                              : undefined
                        }
                        onChange={(event) =>
                          updateField(
                            field.name,
                            event.target.value
                          )
                        }
                        style={{ colorScheme: "dark" }}
                        className="w-full min-w-0 rounded-xl border border-white/15 bg-[#071427] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/15"
                      />

                    </label>
                  );
                })}

              </div>
            </section>
          ))}

          {/* ADDITIONAL INSTRUCTIONS */}

          <section className="overflow-hidden rounded-[24px] border border-[#d4af37]/20 bg-[#0d1c33] shadow-[0_15px_50px_rgba(0,0,0,0.30)]">

            <div className="border-b border-[#d4af37]/15 bg-[#122541] px-6 py-6">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 text-lg font-black text-[#d4af37]">
                  4
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">
                    Additional Instructions
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    Optional collection instructions
                  </p>
                </div>

              </div>

            </div>

            <div className="p-6">

              <textarea
                rows={5}
                value={form.notes}
                onChange={(event) =>
                  updateField("notes", event.target.value)
                }
                placeholder="Special pickup instructions, building details, contact information, or anything else our team should know..."
                className="w-full rounded-xl border border-white/15 bg-[#071427] p-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/15"
              />

            </div>
          </section>

          {/* SUBMIT SECTION */}

          <section className="rounded-[24px] border border-[#d4af37]/20 bg-[#0d1c33] p-6 shadow-xl">

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#d4af37] px-6 py-4 text-base font-black uppercase tracking-wide text-[#050914] shadow-lg transition hover:bg-[#e6c55a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting Pickup Request..."
                : "Submit Pickup Request"}
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-white/50">
              Submitting a request does not confirm your pickup.
              TRI Shipping will review your shipment information
              before scheduling collection.
            </p>

          </section>

        </form>

        {/* FOOTER */}

        <footer className="mt-12 border-t border-[#d4af37]/15 px-4 py-8 text-center">

          <p className="text-base font-black tracking-widest text-[#d4af37]">
            TRI SHIPPING
          </p>

          <p className="mt-2 text-xs text-white/60">
            Where Luxury Meets Logistics
          </p>

          <p className="mt-4 text-xs text-white/35">
            © {new Date().getFullYear()} TRI Shipping.
            All rights reserved.
          </p>

        </footer>

      </div>
    </main>
  );
}