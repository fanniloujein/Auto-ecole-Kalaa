"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createSession, updateSession, deleteSession } from "@/actions/sessions";
import { formatCurrency, formatDate, sessionStatusColor, sessionStatusLabel } from "@/lib/utils";
import { sessionTypeLabels } from "@/lib/labels";
import type { InstructorListItem, VehicleListItem } from "@/types";

interface SessionItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
  amount: number;
  instructorId: string | null;
  instructorName: string | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
}

export function ClientSessionsSection({
  clientId,
  sessions,
  instructors,
  vehicles,
  clientName,
}: {
  clientId: string;
  sessions: SessionItem[];
  instructors: InstructorListItem[];
  vehicles: VehicleListItem[];
  clientName: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SessionItem | undefined>(undefined);
  const [deleting, setDeleting] = useState<SessionItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(undefined);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: SessionItem) {
    setEditing(s);
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      clientId,
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      type: formData.get("type"),
      status: formData.get("status"),
      instructorId: formData.get("instructorId") || null,
      vehicleId: formData.get("vehicleId") || null,
      notes: formData.get("notes") || null,
    };

    startTransition(async () => {
      const result = editing
        ? await updateSession(editing.id, payload)
        : await createSession(payload);

      if (result.success) {
        notify(editing ? "Séance mise à jour" : "Séance ajoutée");
        setModalOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteSession(deleting.id);
      if (result.success) {
        notify("Séance supprimée");
        setDeleting(null);
        router.refresh();
      } else {
        notify(result.error, "error");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm no-print">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Séances</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {sessions.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-400">Aucune séance enregistrée pour {clientName}.</p>
        )}
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(s.date)} · {s.startTime} - {s.endTime}
              </p>
              <p className="text-xs text-slate-400">
                {sessionTypeLabels[s.type] ?? s.type}
                {s.instructorName ? ` · ${s.instructorName}` : ""}
                {s.vehicleLabel ? ` · ${s.vehicleLabel}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {s.amount > 0 && (
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  {formatCurrency(s.amount)}
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full border ${sessionStatusColor(
                  s.status
                )}`}
              >
                {sessionStatusLabel(s.status)}
              </span>
              <button
                onClick={() => openEdit(s)}
                className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeleting(s)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la séance" : "Ajouter une séance"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={editing?.date.slice(0, 10)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select name="type" defaultValue={editing?.type ?? "CONDUITE"} className={inputClass}>
                {Object.entries(sessionTypeLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Heure de début *</label>
              <input
                type="time"
                name="startTime"
                required
                defaultValue={editing?.startTime}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Heure de fin *</label>
              <input
                type="time"
                name="endTime"
                required
                defaultValue={editing?.endTime}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select name="status" defaultValue={editing?.status ?? "PREVUE"} className={inputClass}>
                <option value="PREVUE">Prévue</option>
                <option value="EFFECTUEE">Effectuée</option>
                <option value="ANNULEE">Annulée</option>
                <option value="ABSENCE">Absence</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Moniteur</label>
              <select
                name="instructorId"
                defaultValue={editing?.instructorId ?? ""}
                className={inputClass}
              >
                <option value="">—</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.firstName} {i.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Véhicule</label>
              <select name="vehicleId" defaultValue={editing?.vehicleId ?? ""} className={inputClass}>
                <option value="">—</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plateNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} className={inputClass} />
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
              className="rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
            >
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer la séance" size="sm">
        <p className="text-sm text-slate-600 mb-5">Confirmer la suppression de cette séance ?</p>
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
