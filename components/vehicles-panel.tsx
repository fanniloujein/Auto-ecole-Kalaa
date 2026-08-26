"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createVehicle, updateVehicle, deleteVehicle } from "@/actions/settings";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  licenseType: string;
  isActive: boolean;
}

const licenseTypes = ["A", "A1", "B", "C", "D", "BE", "CE"];

export function VehiclesPanel({ vehicles }: { vehicles: VehicleRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<VehicleRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      brand: formData.get("brand"),
      model: formData.get("model"),
      plateNumber: formData.get("plateNumber"),
      licenseType: formData.get("licenseType"),
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      const result = editing
        ? await updateVehicle(editing.id, payload)
        : await createVehicle(payload);

      if (result.success) {
        notify(editing ? "Véhicule mis à jour" : "Véhicule ajouté");
        setModalOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Erreur");
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteVehicle(deleting.id);
      if (result.success) {
        notify("Véhicule supprimé");
        setDeleting(null);
        router.refresh();
      } else {
        notify(result.error ?? "Erreur", "error");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditing(undefined);
            setError(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5"
        >
          <Plus className="h-4 w-4" /> Ajouter un véhicule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Véhicule</th>
              <th className="text-left px-4 py-3 font-medium">Immatriculation</th>
              <th className="text-left px-4 py-3 font-medium">Permis</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  🚗 {v.brand} {v.model}
                </td>
                <td className="px-4 py-3 text-slate-600">{v.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{v.licenseType}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      v.isActive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {v.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditing(v);
                        setError(null);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(v)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Aucun véhicule enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le véhicule" : "Ajouter un véhicule"}
        size="sm"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Marque *</label>
              <input name="brand" required defaultValue={editing?.brand} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Modèle *</label>
              <input name="model" required defaultValue={editing?.model} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Immatriculation *</label>
            <input
              name="plateNumber"
              required
              defaultValue={editing?.plateNumber}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Type de permis</label>
            <select name="licenseType" defaultValue={editing?.licenseType ?? "B"} className={inputClass}>
              {licenseTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
              className="rounded border-slate-300"
            />
            Véhicule actif
          </label>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
            >
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer le véhicule" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression du véhicule{" "}
          <span className="font-semibold">
            {deleting?.brand} {deleting?.model}
          </span>{" "}
          ?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-slate-300 text-slate-600 text-sm font-medium px-4 py-2"
          >
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            disabled={isPending}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
