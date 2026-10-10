"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import { expenseCategoryLabels, paymentMethodLabels } from "@/lib/labels";

interface ExpenseRow {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  method: string;
  reference: string | null;
  notes: string | null;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ExpensesManager({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<ExpenseRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const months = useMemo(() => {
    const keys = new Set(expenses.map((e) => monthKey(e.date)));
    keys.add(currentMonth);
    return [...keys].sort().reverse();
  }, [expenses, currentMonth]);

  const inPeriod = useMemo(
    () => expenses.filter((e) => !month || monthKey(e.date) === month),
    [expenses, month]
  );

  const filtered = useMemo(
    () =>
      inPeriod.filter(
        (e) =>
          (!categoryFilter || e.category === categoryFilter) &&
          (query.trim() === "" || e.label.toLowerCase().includes(query.toLowerCase()))
      ),
    [inPeriod, categoryFilter, query]
  );

  const periodTotal = inPeriod.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);
  const yearTotal = expenses
    .filter((e) => e.date.slice(0, 4) === (month || currentMonth).slice(0, 4))
    .reduce((sum, e) => sum + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of inPeriod) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [inPeriod]);

  function openCreate() {
    setEditing(undefined);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(e: ExpenseRow) {
    setEditing(e);
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      label: formData.get("label"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      method: formData.get("method"),
      reference: formData.get("reference") || null,
      notes: formData.get("notes") || null,
    };

    startTransition(async () => {
      const result = editing
        ? await updateExpense(editing.id, payload)
        : await createExpense(payload);
      if (result.success) {
        notify(editing ? "Dépense mise à jour" : "Dépense enregistrée");
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
      const result = await deleteExpense(deleting.id);
      if (result.success) {
        notify("Dépense supprimée");
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">
            Dépenses — {month ? monthLabel(month) : "toutes périodes"}
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(periodTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {inPeriod.length} opération{inPeriod.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">
            Cumul de l&apos;année {(month || currentMonth).slice(0, 4)}
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(yearTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium mb-2">Répartition par catégorie</p>
          {byCategory.length === 0 && <p className="text-sm text-slate-400">Aucune dépense.</p>}
          <div className="space-y-1.5">
            {byCategory.slice(0, 5).map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{expenseCategoryLabels[cat] ?? cat}</span>
                  <span className="font-medium text-slate-800">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-0.5">
                  <div
                    className="h-1.5 bg-rose-500 rounded-full"
                    style={{ width: `${periodTotal > 0 ? (amount / periodTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un libellé..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Toutes les périodes</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(expenseCategoryLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ajouter une dépense
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Libellé</th>
                <th className="text-left px-4 py-3 font-medium">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium">Mode</th>
                <th className="text-left px-4 py-3 font-medium">Référence</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {e.label}
                    {e.notes && <p className="text-xs font-normal text-slate-400">{e.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {expenseCategoryLabels[e.category] ?? e.category}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {paymentMethodLabels[e.method] ?? e.method}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600 whitespace-nowrap">
                    − {formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
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
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Aucune dépense sur cette période.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 font-medium text-slate-600">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(filteredTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la dépense" : "Ajouter une dépense"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Libellé *</label>
            <input
              name="label"
              required
              defaultValue={editing?.label}
              placeholder="Ex. : Plein d'essence Clio, vidange, salaire moniteur..."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Catégorie *</label>
              <select name="category" defaultValue={editing?.category ?? "CARBURANT"} className={inputClass}>
                {Object.entries(expenseCategoryLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Montant *</label>
              <input
                type="number"
                min={0.001}
                step="0.001"
                name="amount"
                required
                defaultValue={editing?.amount}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={editing?.date.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mode de paiement</label>
              <select name="method" defaultValue={editing?.method ?? "ESPECES"} className={inputClass}>
                {Object.entries(paymentMethodLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Référence (n° de facture, chèque...)</label>
              <input name="reference" defaultValue={editing?.reference ?? ""} className={inputClass} />
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

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer la dépense" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression de la dépense <span className="font-semibold">{deleting?.label}</span> (
          {deleting ? formatCurrency(deleting.amount) : ""}) ?
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
