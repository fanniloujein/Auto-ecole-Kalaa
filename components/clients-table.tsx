"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Modal } from "@/components/modal";
import { ClientForm } from "@/components/client-form";
import { useToast } from "@/components/toast";
import { deleteClient } from "@/actions/clients";
import { ExamProgressBadges } from "@/components/exam-progress-badges";
import { formatCurrency, paymentStatus, paymentStatusColor, paymentStatusLabel } from "@/lib/utils";
import { licenseTypes } from "@/lib/labels";
import type { Tariffs } from "@/lib/billing";
import type { ClientWithAccount } from "@/types";

export function ClientsTable({
  initialClients,
  tariffs,
}: {
  initialClients: ClientWithAccount[];
  tariffs: Tariffs;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "due" | "ok">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientWithAccount | undefined>(undefined);
  const [deleting, setDeleting] = useState<ClientWithAccount | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return initialClients.filter((c) => {
      const matchesQuery =
        query.trim() === "" ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query) ||
        c.cin.toLowerCase().includes(query.toLowerCase());
      const matchesLicense = !licenseFilter || c.licenseType === licenseFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "due" && c.balance > 0) ||
        (balanceFilter === "ok" && c.balance <= 0);
      return matchesQuery && matchesLicense && matchesStatus && matchesBalance;
    });
  }, [initialClients, query, licenseFilter, statusFilter, balanceFilter]);

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(c: ClientWithAccount) {
    setEditing(c);
    setModalOpen(true);
  }

  function handleSuccess() {
    setModalOpen(false);
    router.refresh();
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteClient(deleting.id);
      if (result.success) {
        notify("Client supprimé");
        setDeleting(null);
        router.refresh();
      } else {
        notify(result.error, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (nom, téléphone, CIN)..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tous les permis</option>
            {licenseTypes.map((t) => (
              <option key={t} value={t}>
                Permis {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Toutes situations</option>
            <option value="due">Reste à payer</option>
            <option value="ok">À jour</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ajouter un client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Inscriptions</th>
                <th className="text-left px-4 py-3 font-medium">Examens</th>
                <th className="text-left px-4 py-3 font-medium">Payé</th>
                <th className="text-left px-4 py-3 font-medium">Reste</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const status = paymentStatus(c.totalDue, c.totalPaid);
                const inscriptions = [
                  c.registeredCode && "Code",
                  c.registeredPark && "Park",
                  c.registeredConduite && "Conduite",
                ].filter(Boolean);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {c.firstName.charAt(0)}
                          {c.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-blue-700 whitespace-nowrap">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-slate-400 whitespace-nowrap">
                            Permis {c.licenseType} · {c.phone}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inscriptions.length > 0 ? inscriptions.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ExamProgressBadges progress={c.examProgress} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-700">{formatCurrency(c.totalPaid)}</p>
                      <p className="text-xs text-slate-400">sur {formatCurrency(c.totalDue)}</p>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium whitespace-nowrap ${
                        c.balance > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {c.balance > 0
                        ? formatCurrency(c.balance)
                        : c.balance < 0
                          ? `Avance ${formatCurrency(-c.balance)}`
                          : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap ${paymentStatusColor(
                          status
                        )}`}
                      >
                        {paymentStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/clients/${c.id}`}
                          className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Voir la fiche"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(c)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Aucun client trouvé.
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
        title={editing ? "Modifier le client" : "Ajouter un client"}
        size="lg"
      >
        <ClientForm client={editing} tariffs={tariffs} onSuccess={handleSuccess} />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Confirmer la suppression" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Êtes-vous sûr de vouloir supprimer le client{" "}
          <span className="font-semibold">
            {deleting?.firstName} {deleting?.lastName}
          </span>
          ? Cette action est irréversible et supprimera également ses séances, examens et paiements.
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
