import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, remainingAmount } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

// Route publique : aucune authentification requise.
// Le token est un identifiant unique non devinable (cuid), différent de l'id interne du client.
export default async function PublicFichePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { publicToken: token },
    include: {
      package: true,
      sessions: {
        where: { status: "PREVUE" },
        orderBy: [{ date: "asc" }],
        take: 1,
      },
    },
  });

  if (!client) notFound();

  const settings = await prisma.settings.findFirst();
  const remaining = remainingAmount(client.totalPrice, client.paidAmount);
  const remainingSessions = Math.max(0, client.totalSessions - client.doneSessions);
  const nextSession = client.sessions[0];

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0">
      <PrintButton hideBack />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg print:shadow-none print:rounded-none p-8 sm:p-10">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center text-2xl">
              🚗
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900">
                {settings?.schoolName ?? "Auto-École"}
              </p>
              {settings?.address && <p className="text-xs text-slate-400">{settings.address}</p>}
              {settings?.phone && <p className="text-xs text-slate-400">{settings.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Fiche générée le</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(new Date())}</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-4">
          {client.firstName} {client.lastName}
        </h1>

        <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
          <span className="text-slate-500">Téléphone</span>
          <span className="text-slate-800 font-medium">{client.phone}</span>
          <span className="text-slate-500">Type de permis</span>
          <span className="text-slate-800 font-medium">{client.licenseType}</span>
          <span className="text-slate-500">Formule</span>
          <span className="text-slate-800 font-medium">{client.package?.name ?? "—"}</span>
        </div>

        <div className="border-t border-slate-200 pt-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">💰 Formation</h2>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span className="text-slate-500">Prix total</span>
            <span className="text-slate-800 font-medium">{formatCurrency(client.totalPrice)}</span>
            <span className="text-slate-500">Montant payé</span>
            <span className="text-slate-800 font-medium">{formatCurrency(client.paidAmount)}</span>
            <span className="text-slate-500">Montant restant</span>
            <span className="text-slate-800 font-medium">{formatCurrency(remaining)}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">📚 Séances</h2>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span className="text-slate-500">Total</span>
            <span className="text-slate-800 font-medium">{client.totalSessions}</span>
            <span className="text-slate-500">Effectuées</span>
            <span className="text-slate-800 font-medium">{client.doneSessions}</span>
            <span className="text-slate-500">Restantes</span>
            <span className="text-slate-800 font-medium">{remainingSessions}</span>
          </div>
        </div>

        {nextSession && (
          <div className="border-t border-slate-200 pt-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">📅 Prochain rendez-vous</h2>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-800 font-medium">{formatDate(nextSession.date)}</span>
              <span className="text-slate-500">Heure</span>
              <span className="text-slate-800 font-medium">
                {nextSession.startTime} - {nextSession.endTime}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4 mt-6 text-center text-xs text-slate-400">
          Merci de votre confiance — {settings?.schoolName ?? "Auto-École"}
        </div>
      </div>
    </div>
  );
}
