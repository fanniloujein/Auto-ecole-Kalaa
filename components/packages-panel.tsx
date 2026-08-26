"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createPackage, updatePackage, deletePackage } from "@/actions/settings";
import { formatCurrency } from "@/lib/utils";

interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sessionsCount: number;
  isActive: boolean;
}

export function PackagesPanel({ packages }: { packages: PackageRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<PackageRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      price: formData.get("price"),
      sessionsCount: formData.get("sessionsCount"),
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      const result = editing
        ? await updatePackage(editing.id, payload)
        : await createPackage(payload);

      if (result.success) {
        notify(editing ? "Formule mise à jour" : "Formule ajoutée");
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
      const result = await deletePackage(deleting.id);
      if (result.success) {
        notify("Formule supprimée");
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
          <Plus className="h-4 w-4" /> Ajouter une formule
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{p.name}</p>
                {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  p.isActive
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {p.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-slate-600">
                Prix : <span className="font-semibold">{formatCurrency(p.price)}</span>
              </p>
              <p className="text-slate-600">
                Séances : <span className="font-semibold">{p.sessionsCount}</span>
              </p>
              <p className="text-slate-600">
                Prix / séance :{" "}
                <span className="font-semibold">
                  {p.sessionsCount > 0 ? formatCurrency(p.price / p.sessionsCount) : "—"}
                </span>
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-1">
              <button
                onClick={() => {
                  setEditing(p);
                  setError(null);
                  setModalOpen(true);
                }}
                className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleting(p)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {packages.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-8">Aucune formule créée.</p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la formule" : "Ajouter une formule"}
        size="sm"
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nom *</label>
            <input name="name" required defaultValue={editing?.name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input name="description" defaultValue={editing?.description ?? ""} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Prix *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                name="price"
                required
                defaultValue={editing?.price}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nombre de séances *</label>
              <input
                type="number"
                min={0}
                name="sessionsCount"
                required
                defaultValue={editing?.sessionsCount}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
              className="rounded border-slate-300"
            />
            Formule active
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

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer la formule" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression de la formule <span className="font-semibold">{deleting?.name}</span> ?
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
