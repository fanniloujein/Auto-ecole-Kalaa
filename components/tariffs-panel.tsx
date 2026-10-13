"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { updateTariffs } from "@/actions/settings";
import type { Tariffs } from "@/lib/billing";

const groups = [
  {
    title: "Heures de formation",
    hint: "Facturées pour chaque séance effectuée, au prorata de sa durée. Les séances de park sont facturées au tarif conduite.",
    fields: [
      { name: "priceHourConduite", label: "1 heure de conduite" },
      { name: "priceHourCode", label: "1 heure de code" },
    ],
  },
  {
    title: "Frais d'inscription",
    hint: "Proposés par défaut lors de l'inscription d'un client (modifiables au cas par cas).",
    fields: [
      { name: "feeInscriptionCode", label: "Inscription code" },
      { name: "feeInscriptionConduite", label: "Inscription conduite" },
      { name: "feeInscriptionPark", label: "Inscription park" },
    ],
  },
  {
    title: "Repassage d'examen",
    hint: "Facturés au client qui repasse un examen après un échec ou une absence. Proposés automatiquement lors de la programmation du nouveau passage (compte Examens).",
    fields: [
      { name: "feeRetakeCode", label: "Repassage examen du code" },
      { name: "feeRetakePark", label: "Repassage examen du park" },
      { name: "feeRetakeConduite", label: "Repassage examen de conduite" },
    ],
  },
] as const;

export function TariffsPanel({ tariffs, currency }: { tariffs: Tariffs; currency: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = Object.fromEntries(
      groups.flatMap((g) => g.fields.map((f) => [f.name, formData.get(f.name)]))
    );
    startTransition(async () => {
      const result = await updateTariffs(payload);
      if (result.success) {
        notify("Tarifs mis à jour");
        router.refresh();
      } else {
        setError(result.error ?? "Erreur");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 pl-3 pr-14 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-600";

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      {groups.map((g) => (
        <div key={g.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800">{g.title}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{g.hint}</p>
          <div className="divide-y divide-slate-100">
            {g.fields.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-4 py-2.5">
                <label htmlFor={f.name} className="text-sm text-slate-700">
                  {f.label}
                </label>
                <div className="relative w-40">
                  <input
                    id={f.name}
                    type="number"
                    min={0}
                    step="0.001"
                    name={f.name}
                    required
                    defaultValue={tariffs[f.name]}
                    className={inputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-500">
        Un changement de tarif s&apos;applique aux nouvelles séances et aux nouvelles inscriptions ; les
        séances et inscriptions déjà enregistrées conservent leur tarif d&apos;origine.
      </p>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer les tarifs
        </button>
      </div>
    </form>
  );
}
