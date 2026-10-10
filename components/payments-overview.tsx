"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createPayment, deletePayment } from "@/actions/payments";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { paymentCategoryLabels, paymentCategoryOrder, paymentMethodLabels } from "@/lib/labels";
import type { AccountLine } from "@/lib/billing";

interface PaymentRow {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  category: string;
  method: string;
  reference: string | null;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
  lines: Record<string, AccountLine>;
}

interface CategorySummary {
  category: string;
  collected: number;
  outstanding: number;
}

export function PaymentsOverview({
  payments,
  clients,
  summary,
}: {
  payments: PaymentRow[];
  clients: ClientOption[];
  summary: CategorySummary[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<PaymentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("INSCRIPTION");

  const filtered = useMemo(() => {
    return payments.filter(
      (p) =>
        (query.trim() === "" || p.clientName.toLowerCase().includes(query.toLowerCase())) &&
        (!categoryFilter || p.category === categoryFilter)
    );
  }, [payments, query, categoryFilter]);

  const totalCollected = summary.reduce((sum, s) => sum + s.collected, 0);
  const totalOutstanding = summary.reduce((sum, s) => sum + s.outstanding, 0);
  const filteredTotal = filtered.reduce((sum, p) => sum + p.amount, 0);

  const client = clients.find((c) => c.id === selectedClient);

  function openCreate() {
    setError(null);
    setSelectedClient("");
    setSelectedCategory("INSCRIPTION");
    setModalOpen(true);
  }

  function handleClientChange(id: string) {
    setSelectedClient(id);
    const c = clients.find((x) => x.id === id);
    const firstDue = c && paymentCategoryOrder.find((cat) => c.lines[cat]?.balance > 0);
    if (firstDue) setSelectedCategory(firstDue);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      clientId: formData.get("clientId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      category: formData.get("category"),
      method: formData.get("method"),
      reference: formData.get("reference") || null,
      notes: formData.get("notes") || null,
    };

    startTransition(async () => {
      const result = await createPayment(payload);
      if (result.success) {
        notify("Paiement enregistré");
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
      const result = await deletePayment(deleting.id);
      if (result.success) {
        notify("Paiement supprimé");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">Total encaissé</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">Total restant à percevoir</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((s) => (
          <button
            key={s.category}
            onClick={() => setCategoryFilter(categoryFilter === s.category ? "" : s.category)}
            className={cn(
              "text-left bg-white rounded-xl border shadow-sm p-4 transition-colors",
              categoryFilter === s.category
                ? "border-blue-600 ring-1 ring-blue-600"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {paymentCategoryLabels[s.category]}
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(s.collected)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Reste à percevoir :{" "}
              <span className={s.outstanding > 0 ? "text-rose-600 font-medium" : ""}>
                {formatCurrency(s.outstanding)}
              </span>
            </p>
          </button>
        ))}
      </div>

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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tous les comptes</option>
            {paymentCategoryOrder.map((c) => (
              <option key={c} value={c}>
                {paymentCategoryLabels[c]}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Enregistrer un paiement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Compte</th>
                <th className="text-left px-4 py-3 font-medium">Montant</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Mode</th>
                <th className="text-left px-4 py-3 font-medium">Référence</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.clientName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {paymentCategoryLabels[p.category] ?? p.category}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {paymentMethodLabels[p.method] ?? p.method}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDeleting(p)}
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
                    Aucun paiement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 text-sm">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-medium text-slate-600">
                    Total ({filtered.length} paiement{filtered.length > 1 ? "s" : ""})
                  </td>
                  <td colSpan={5} className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un paiement">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client *</label>
            <select
              name="clientId"
              required
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
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

          {client && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentCategoryOrder.map((cat) => {
                const line = client.lines[cat];
                return (
                  <div key={cat} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      {paymentCategoryLabels[cat]}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        line.balance > 0 ? "text-rose-600" : "text-emerald-600"
                      )}
                    >
                      {line.balance > 0
                        ? formatCurrency(line.balance)
                        : line.balance < 0
                          ? `Avance ${formatCurrency(-line.balance)}`
                          : "Soldé"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Compte *</label>
              <select
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={inputClass}
              >
                {paymentCategoryOrder.map((c) => (
                  <option key={c} value={c}>
                    {paymentCategoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Montant *</label>
              <input type="number" min={0.001} step="0.001" name="amount" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mode de paiement</label>
              <select name="method" defaultValue="ESPECES" className={inputClass}>
                {Object.entries(paymentMethodLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Référence (n° de reçu, chèque...)</label>
              <input name="reference" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea name="notes" rows={2} className={inputClass} />
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
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Supprimer le paiement" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Confirmer la suppression de ce paiement de {deleting ? formatCurrency(deleting.amount) : ""} pour{" "}
          {deleting?.clientName} ?
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
