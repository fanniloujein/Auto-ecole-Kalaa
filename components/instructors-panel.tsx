"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createInstructor, updateInstructor, deleteInstructor } from "@/actions/settings";

interface InstructorRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
}

export function InstructorsPanel({ instructors }: { instructors: InstructorRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<InstructorRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone") || null,
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      const result = editing
        ? await updateInstructor(editing.id, payload)
        : await createInstructor(payload);

      if (result.success) {
        notify(editing ? "Moniteur mis à jour" : "Moniteur ajouté");
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
      const result = await deleteInstructor(deleting.id);
      if (result.success) {
        notify("Moniteur supprimé");
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
          <Plus className="h-4 w-4" /> Ajouter un moniteur
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nom</th>
              <th className="text-left px-4 py-3 font-medium">Téléphone</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {instructors.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  👤 {i.firstName} {i.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">{i.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      i.isActive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {i.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditing(i);
                        setError(null);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(i)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Aucun moniteur enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le moniteur" : "Ajouter un moniteur"}
        size="sm"
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Prénom *</label>
              <input name="firstName" required defaultValue={editing?.firstName} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom *</label>
              <input name="lastName" required defaultValue={editing?.lastName} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input name="phone" defaultValue={editing?.phone ?? ""} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
              className="rounded border-slate-300"
            />
            Moniteur actif
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

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer le moniteur" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression de{" "}
          <span className="font-semibold">
            {deleting?.firstName} {deleting?.lastName}
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
