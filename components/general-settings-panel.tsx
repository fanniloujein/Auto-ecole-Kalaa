"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { updateSettings } from "@/actions/settings";

interface SettingsData {
  schoolName: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  currency: string;
}

export function GeneralSettingsPanel({ settings }: { settings: SettingsData | null }) {
  const router = useRouter();
  const { notify } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      schoolName: formData.get("schoolName"),
      address: formData.get("address") || null,
      phone: formData.get("phone") || null,
      whatsapp: formData.get("whatsapp") || null,
      email: formData.get("email") || null,
      currency: formData.get("currency"),
    };

    startTransition(async () => {
      const result = await updateSettings(payload);
      if (result.success) {
        notify("Paramètres mis à jour");
        router.refresh();
      } else {
        setError(result.error ?? "Erreur");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-xl">
      <h2 className="font-semibold text-slate-800 mb-4">Informations de l&apos;auto-école</h2>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nom de l&apos;auto-école *</label>
          <input
            name="schoolName"
            required
            defaultValue={settings?.schoolName ?? "Auto-École"}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Adresse</label>
          <input name="address" defaultValue={settings?.address ?? ""} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input name="phone" defaultValue={settings?.phone ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input name="whatsapp" defaultValue={settings?.whatsapp ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="email"
              defaultValue={settings?.email ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Devise</label>
            <input name="currency" defaultValue={settings?.currency ?? "TND"} className={inputClass} />
          </div>
        </div>

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
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
