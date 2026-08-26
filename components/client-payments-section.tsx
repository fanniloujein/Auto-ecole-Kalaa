"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createPayment, deletePayment } from "@/actions/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentItem {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference: string | null;
  notes: string | null;
}

const methodLabels: Record<string, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  CARTE: "Carte",
  AUTRE: "Autre",
};

export function ClientPaymentsSection({
  clientId,
  payments,
  clientName,
}: {
  clientId: string;
  payments: PaymentItem[];
  clientName: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<PaymentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      clientId,
      amount: formData.get("amount"),
      date: formData.get("date"),
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm no-print">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Paiements</h2>
        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" /> Enregistrer un paiement
        </button>
      </div>
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {payments.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-400">Aucun paiement enregistré pour {clientName}.</p>
        )}
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{formatCurrency(p.amount)}</p>
              <p className="text-xs text-slate-400">
                {formatDate(p.date)} · {methodLabels[p.method] ?? p.method}
                {p.reference ? ` · Réf: ${p.reference}` : ""}
              </p>
            </div>
            <button
              onClick={() => setDeleting(p)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un paiement">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant *</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                name="amount"
                required
                className={inputClass}
              />
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
                {Object.entries(methodLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Référence</label>
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
          Confirmer la suppression de ce paiement de {deleting ? formatCurrency(deleting.amount) : ""} ?
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
