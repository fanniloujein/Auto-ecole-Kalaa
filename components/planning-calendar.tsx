"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createSession, updateSession, deleteSession } from "@/actions/sessions";
import { sessionStatusColor, sessionStatusLabel } from "@/lib/utils";
import type { InstructorListItem, VehicleListItem } from "@/types";

interface PlanningSession {
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

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
}

const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const typeLabels: Record<string, string> = {
  CONDUITE: "Conduite",
  CODE: "Code",
  EXAMEN_BLANC: "Examen blanc",
  AUTRE: "Autre",
};

function toKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlanningCalendar({
  sessions,
  clients,
  instructors,
  vehicles,
}: {
  sessions: PlanningSession[];
  clients: ClientOption[];
  instructors: InstructorListItem[];
  vehicles: VehicleListItem[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningSession | undefined>(undefined);
  const [deleting, setDeleting] = useState<PlanningSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, PlanningSession[]>();
    for (const s of sessions) {
      const key = toKey(new Date(s.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);

    const result: Date[] = [];
    for (let i = 0; i < 42; i++) {
      result.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return result;
  }, [cursor]);

  const selectedSessions = selectedDay ? sessionsByDay.get(toKey(selectedDay)) ?? [] : [];

  function openCreate() {
    setEditing(undefined);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: PlanningSession) {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">
            {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="text-xs font-medium text-slate-500 hover:text-blue-700 px-2"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
          {weekdays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const daySessions = sessionsByDay.get(toKey(day)) ?? [];
            const isToday = toKey(day) === toKey(new Date());
            const isSelected = selectedDay && toKey(day) === toKey(selectedDay);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[70px] rounded-lg border text-left p-1.5 transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-100 hover:border-slate-300"
                } ${!inMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? "bg-blue-700 text-white rounded-full px-1.5 py-0.5" : "text-slate-600"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {daySessions.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="text-[10px] truncate rounded bg-blue-100 text-blue-700 px-1 py-0.5"
                    >
                      {s.startTime} {s.clientName}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[10px] text-slate-400">+{daySessions.length - 2} autres</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">
            {selectedDay
              ? selectedDay.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : "Sélectionnez un jour"}
          </h2>
          {selectedDay && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          )}
        </div>
        <div className="space-y-3">
          {selectedDay && selectedSessions.length === 0 && (
            <p className="text-sm text-slate-400">Aucune séance ce jour-là.</p>
          )}
          {selectedSessions
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((s) => (
              <div key={s.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{s.clientName}</p>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sessionStatusColor(
                      s.status
                    )}`}
                  >
                    {sessionStatusLabel(s.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {s.startTime} - {s.endTime}
                  {s.instructorName ? ` · ${s.instructorName}` : ""}
                  {s.vehicleLabel ? ` · ${s.vehicleLabel}` : ""}
                </p>
                <div className="flex justify-end gap-1 mt-2">
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
                defaultValue={
                  editing ? editing.date.slice(0, 10) : selectedDay ? toInputDate(selectedDay) : ""
                }
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
