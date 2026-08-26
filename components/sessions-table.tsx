"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createSession, updateSession, deleteSession } from "@/actions/sessions";
import { formatDate, sessionStatusColor, sessionStatusLabel } from "@/lib/utils";
import type { InstructorListItem, VehicleListItem } from "@/types";

interface SessionRow {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
  instructorId: string | null;
  instructorName: string | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
}

const typeLabels: Record<string, string> = {
  CONDUITE: "Conduite",
  CODE: "Code",
  EXAMEN_BLANC: "Examen blanc",
  AUTRE: "Autre",
};

export function SessionsTable({
  initialSessions,
  clients,
  instructors,
  vehicles,
}: {
  initialSessions: SessionRow[];
  clients: { id: string; firstName: string; lastName: string }[];
  instructors: InstructorListItem[];
  vehicles: VehicleListItem[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SessionRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<SessionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return initialSessions.filter((s) => {
      const matchesQuery =
        query.trim() === "" || s.clientName.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [initialSessions, query, statusFilter]);

  function openCreate() {
    setEditing(undefined);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: SessionRow) {
    setEditing(s);
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      clientId: formData.get("clientId"),
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tous les statuts</option>
            <option value="PREVUE">Prévue</option>
            <option value="EFFECTUEE">Effectuée</option>
            <option value="ANNULEE">Annulée</option>
            <option value="ABSENCE">Absence</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ajouter une séance
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Date &amp; heure</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Moniteur / Véhicule</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(s.date)} · {s.startTime}-{s.endTime}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{typeLabels[s.type] ?? s.type}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.instructorName ?? "—"} {s.vehicleLabel ? `/ ${s.vehicleLabel}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${sessionStatusColor(
                        s.status
                      )}`}
                    >
                      {sessionStatusLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(s)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Aucune séance trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la séance" : "Ajouter une séance"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client *</label>
            <select
              name="clientId"
              required
              defaultValue={editing?.clientId ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                Sélectionner un client
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
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
                {Object.entries(typeLabels).map(([v, l]) => (
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
