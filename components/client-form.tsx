"use client";

import { useState, useTransition } from "react";
import { createClient, updateClient } from "@/actions/clients";
import { useToast } from "@/components/toast";
import type { ClientListItem, PackageListItem } from "@/types";
import { Loader2 } from "lucide-react";

const licenseTypes = ["A", "A1", "B", "C", "D", "BE", "CE"];

function toInputDate(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 10);
}

export function ClientForm({
  client,
  packages,
  onSuccess,
}: {
  client?: ClientListItem;
  packages: PackageListItem[];
  onSuccess: () => void;
}) {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(client?.packageId ?? "");

  function handlePackageChange(id: string) {
    setSelectedPackage(id);
  }

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
      packageId: formData.get("packageId") || null,
      totalSessions: formData.get("totalSessions"),
      doneSessions: formData.get("doneSessions"),
      totalPrice: formData.get("totalPrice"),
      paidAmount: formData.get("paidAmount"),
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
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600";
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
                  {t}
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
          <div className="sm:col-span-2">
            <label className={labelClass}>Formule</label>
            <select
              name="packageId"
              value={selectedPackage}
              onChange={(e) => handlePackageChange(e.target.value)}
              className={inputClass}
            >
              <option value="">— Aucune —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price} — {p.sessionsCount} séances)
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Séances &amp; paiement</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Total séances</label>
            <input
              type="number"
              min={0}
              name="totalSessions"
              defaultValue={client?.totalSessions ?? 0}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Effectuées</label>
            <input
              type="number"
              min={0}
              name="doneSessions"
              defaultValue={client?.doneSessions ?? 0}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Prix total</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="totalPrice"
              defaultValue={client?.totalPrice ?? 0}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Montant payé</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="paidAmount"
              defaultValue={client?.paidAmount ?? 0}
              className={inputClass}
            />
          </div>
        </div>
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
