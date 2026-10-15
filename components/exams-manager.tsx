"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, RotateCcw, Check, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createExam, updateExam, deleteExam, setExamResult } from "@/actions/exams";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  examResultColor,
  examResultLabels,
  examTypeLabels,
  examTypeOrder,
} from "@/lib/labels";

export interface ExamRow {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  date: string;
  time: string | null;
  result: string;
  fee: number;
  retakeFee: number;
  location: string | null;
  notes: string | null;
  attempt: number;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
}

function ordinal(n: number) {
  return n === 1 ? "1er passage" : `${n}e passage`;
}

/**
 * Gestion des examens officiels (code, park, conduite).
 * - Sur la page Examens : liste complète, avec choix du client.
 * - Sur la fiche client : `clientId` fixé, liste des passages du client.
 */
export function ExamsManager({
  exams,
  clients,
  clientId,
  retakeFees,
}: {
  exams: ExamRow[];
  clients?: ClientOption[];
  clientId?: string;
  /** Frais de repassage par type d'examen (CODE, PARK, CONDUITE), ajoutés automatiquement en cas d'échec */
  retakeFees: Record<string, number>;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRow | undefined>(undefined);
  const [preset, setPreset] = useState<{ clientId?: string; type?: string }>({});
  const [formType, setFormType] = useState("CODE");
  const [deleting, setDeleting] = useState<ExamRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const compact = !!clientId;

  const filtered = useMemo(() => {
    return exams.filter(
      (e) =>
        (query.trim() === "" || e.clientName.toLowerCase().includes(query.toLowerCase())) &&
        (!typeFilter || e.type === typeFilter) &&
        (!resultFilter || e.result === resultFilter)
    );
  }, [exams, query, typeFilter, resultFilter]);

  function openCreate(p: { clientId?: string; type?: string } = {}) {
    setEditing(undefined);
    setPreset(p);
    setFormType(p.type ?? "CODE");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(e: ExamRow) {
    setEditing(e);
    setPreset({});
    setFormType(e.type);
    setError(null);
    setModalOpen(true);
  }

  function quickResult(e: ExamRow, result: "REUSSI" | "ECHOUE") {
    startTransition(async () => {
      const res = await setExamResult(e.id, result);
      if (res.success) {
        notify(
          result === "REUSSI"
            ? `${examTypeLabels[e.type]} réussi`
            : `Échec enregistré — frais de repassage ajoutés (${formatCurrency(retakeFees[e.type] ?? 0)})`
        );
        router.refresh();
      } else {
        notify(res.error, "error");
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      clientId: clientId ?? formData.get("clientId"),
      type: formData.get("type"),
      date: formData.get("date"),
      time: formData.get("time") || null,
      result: formData.get("result"),
      fee: formData.get("fee") || 0,
      location: formData.get("location") || null,
      notes: formData.get("notes") || null,
    };

    startTransition(async () => {
      const result = editing ? await updateExam(editing.id, payload) : await createExam(payload);
      if (result.success) {
        notify(editing ? "Examen mis à jour" : "Examen enregistré");
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
      const result = await deleteExam(deleting.id);
      if (result.success) {
        notify("Examen supprimé");
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

  const actions = (e: ExamRow) => (
    <div className="flex items-center justify-end gap-1">

      {(e.result === "ECHOUE" || e.result === "ABSENT") &&
        !exams.some(
          (x) =>
            x.clientId === e.clientId &&
            x.type === e.type &&
            (x.result === "REUSSI" || x.result === "PROGRAMME" || x.attempt > e.attempt)
        ) && (
          <button
            onClick={() => openCreate({ clientId: e.clientId, type: e.type })}
            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            title="Programmer un nouveau passage"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      <button
        onClick={() => openEdit(e)}
        className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
        title="Modifier"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => setDeleting(e)}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Examen programmé : saisie du résultat en un clic ; sinon badge du résultat
  const resultBadge = (e: ExamRow) =>
    e.result === "PROGRAMME" ? (
      <div className="flex items-center gap-1">
        <button
          onClick={() => quickResult(e, "REUSSI")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium px-2 py-1.5 disabled:opacity-60"
          title="Marquer comme réussi"
        >
          <Check className="h-3.5 w-3.5" /> Réussi
        </button>
        <button
          onClick={() => quickResult(e, "ECHOUE")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium px-2 py-1.5 disabled:opacity-60"
          title={`Marquer comme échoué (+${formatCurrency(retakeFees[e.type] ?? 0)} de repassage)`}
        >
          <X className="h-3.5 w-3.5" /> Échoué
        </button>
      </div>
    ) : (
      <span
        className={cn(
          "text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap",
          examResultColor(e.result)
        )}
      >
        {examResultLabels[e.result] ?? e.result}
      </span>
    );

  const feesLabel = (e: ExamRow) =>
    [
      e.retakeFee > 0 && `Repassage ${formatCurrency(e.retakeFee)}`,
      e.fee > 0 && `Frais ${formatCurrency(e.fee)}`,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className={compact ? "bg-white rounded-xl border border-slate-200 shadow-sm no-print" : "space-y-4"}>
      {compact ? (
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Examens</h2>
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" /> Programmer un examen
          </button>
        </div>
      ) : (
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tous les examens</option>
              {examTypeOrder.map((t) => (
                <option key={t} value={t}>
                  {examTypeLabels[t]}
                </option>
              ))}
            </select>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tous les résultats</option>
              {Object.entries(examResultLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Programmer un examen
          </button>
        </div>
      )}

      {compact ? (
        <div className="divide-y divide-slate-100">
          {exams.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400">Aucun examen enregistré.</p>
          )}
          {exams.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {examTypeLabels[e.type]}{" "}
                  <span className="text-xs font-normal text-slate-500">· {ordinal(e.attempt)}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(e.date)}
                  {e.time ? ` à ${e.time}` : ""}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {feesLabel(e) && (
                  <p className="text-xs font-medium text-rose-600">{feesLabel(e)}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {resultBadge(e)}
                {actions(e)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-3 font-medium">Client</th>
                  <th className="text-left px-3 py-3 font-medium">Examen</th>
                  <th className="text-left px-3 py-3 font-medium">Passage</th>
                  <th className="text-left px-3 py-3 font-medium">Date</th>
                  <th className="text-left px-3 py-3 font-medium">Frais</th>
                  <th className="text-left px-3 py-3 font-medium">Résultat</th>
                  <th className="text-right px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{e.clientName}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{examTypeLabels[e.type]}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{ordinal(e.attempt)}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(e.date)}
                      {e.time ? ` · ${e.time}` : ""}
                      {e.location && <p className="text-xs text-slate-400">{e.location}</p>}
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {feesLabel(e) || "—"}
                    </td>
                    <td className="px-3 py-3">{resultBadge(e)}</td>
                    <td className="px-3 py-3">{actions(e)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Aucun examen trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier l'examen" : "Programmer un examen"}
      >
        <form action={handleSubmit} className="space-y-4">
          {!clientId && (
            <div>
              <label className={labelClass}>Client *</label>
              <select
                name="clientId"
                required
                defaultValue={editing?.clientId ?? preset.clientId ?? ""}
                className={inputClass}
              >
                <option value="" disabled>
                  Sélectionner un client
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Examen *</label>
              <select
                name="type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className={inputClass}
              >
                {examTypeOrder.map((t) => (
                  <option key={t} value={t}>
                    {examTypeLabels[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Résultat</label>
              <select name="result" defaultValue={editing?.result ?? "PROGRAMME"} className={inputClass}>
                {Object.entries(examResultLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
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
              <label className={labelClass}>Heure</label>
              <input type="time" name="time" defaultValue={editing?.time ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lieu / centre d&apos;examen</label>
              <input name="location" defaultValue={editing?.location ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Autres frais (optionnel)</label>
              <input
                type="number"
                min={0}
                step="0.001"
                name="fee"
                defaultValue={editing?.fee ?? 0}
                className={inputClass}
              />
            </div>
            <div className="col-span-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
              En cas d&apos;échec ou d&apos;absence, les frais de repassage (
              <span className="font-semibold">{formatCurrency(retakeFees[formType] ?? 0)}</span>) sont
              ajoutés automatiquement au compte « Repassage d&apos;examen » du client.
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
              {editing ? "Enregistrer" : "Programmer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer l'examen" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression de cet examen ({deleting ? examTypeLabels[deleting.type] : ""}
          {deleting && !compact ? ` — ${deleting.clientName}` : ""}) ?
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
