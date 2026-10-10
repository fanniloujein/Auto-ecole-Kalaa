"use client";

import { useState, useTransition } from "react";
import { createClient, updateClient } from "@/actions/clients";
import { useToast } from "@/components/toast";
import type { ClientListItem } from "@/types";
import type { Tariffs } from "@/lib/billing";
import { licenseTypes } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function toInputDate(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 10);
}

const registrations = [
  { key: "Code", label: "Inscription code", tariff: "feeInscriptionCode" },
  { key: "Conduite", label: "Inscription conduite", tariff: "feeInscriptionConduite" },
  { key: "Park", label: "Inscription park", tariff: "feeInscriptionPark" },
] as const;

export function ClientForm({
  client,
  tariffs,
  onSuccess,
}: {
  client?: ClientListItem;
  tariffs: Tariffs;
  onSuccess: () => void;
}) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState({
    Code: client?.registeredCode ?? false,
    Conduite: client?.registeredConduite ?? false,
    Park: client?.registeredPark ?? false,
  });
  const [fees, setFees] = useState({
    Code: client?.registeredCode ? client.feeInscriptionCode : tariffs.feeInscriptionCode,
    Conduite: client?.registeredConduite
      ? client.feeInscriptionConduite
      : tariffs.feeInscriptionConduite,
    Park: client?.registeredPark ? client.feeInscriptionPark : tariffs.feeInscriptionPark,
  });

  const totalInscription = registrations.reduce(
    (sum, r) => sum + (checked[r.key] ? Number(fees[r.key]) || 0 : 0),
    0
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      cin: formData.get("cin"),
      birthDate: formData.get("birthDate") || null,
      address: formData.get("address") || null,
      licenseType: formData.get("licenseType"),
      startDate: formData.get("startDate") || null,
      registeredCode: checked.Code,
      registeredConduite: checked.Conduite,
      registeredPark: checked.Park,
      feeInscriptionCode: fees.Code,
      feeInscriptionConduite: fees.Conduite,
      feeInscriptionPark: fees.Park,
      notes: formData.get("notes") || null,
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      const result = client
        ? await updateClient(client.id, payload)
        : await createClient(payload);

      if (result.success) {
        notify(client ? "Client mis à jour" : "Client ajouté avec succès");
        onSuccess();
      } else {
        setError(result.error);
        notify(result.error, "error");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-400";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form action={handleSubmit} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Informations personnelles</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prénom *</label>
            <input name="firstName" required defaultValue={client?.firstName} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nom *</label>
            <input name="lastName" required defaultValue={client?.lastName} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone *</label>
            <input name="phone" required defaultValue={client?.phone} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Numéro WhatsApp *</label>
            <input
              name="whatsapp"
              required
              defaultValue={client?.whatsapp}
              placeholder="+216 XX XXX XXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>CIN / Identifiant *</label>
            <input name="cin" required defaultValue={client?.cin} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date de naissance</label>
            <input
              type="date"
              name="birthDate"
              defaultValue={toInputDate(client?.birthDate)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Adresse</label>
            <input name="address" defaultValue={client?.address ?? ""} className={inputClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Formation</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type de permis *</label>
            <select
              name="licenseType"
              required
              defaultValue={client?.licenseType ?? "B"}
              className={inputClass}
            >
              {licenseTypes.map((t) => (
                <option key={t} value={t}>
                  Permis {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date de début</label>
            <input
              type="date"
              name="startDate"
              defaultValue={toInputDate(client?.startDate)}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Inscriptions</legend>
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
          {registrations.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked[r.key]}
                  onChange={(e) => setChecked({ ...checked, [r.key]: e.target.checked })}
                  className="rounded border-slate-300"
                />
                {r.label}
              </label>
              <div className="w-32">
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  aria-label={`Montant ${r.label}`}
                  disabled={!checked[r.key]}
                  value={fees[r.key]}
                  onChange={(e) => setFees({ ...fees, [r.key]: Number(e.target.value) })}
                  className={`${inputClass} text-right`}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 text-sm">
            <span className="font-medium text-slate-600">Total frais d&apos;inscription</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totalInscription)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Les heures sont facturées selon les tarifs en vigueur : conduite et park{" "}
          {formatCurrency(tariffs.priceHourConduite)} / h, code {formatCurrency(tariffs.priceHourCode)} / h.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Notes administratives</legend>
        <textarea
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ""}
          placeholder="Notes internes — jamais envoyées au client"
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={client?.isActive ?? true}
            className="rounded border-slate-300"
          />
          Client actif
        </label>
      </fieldset>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {client ? "Enregistrer" : "Ajouter le client"}
        </button>
      </div>
    </form>
  );
}
