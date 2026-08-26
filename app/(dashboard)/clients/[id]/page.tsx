import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  IdCard,
  Calendar,
  Wallet,
  BookOpen,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  paymentStatus,
  paymentStatusColor,
  paymentStatusLabel,
  remainingAmount,
} from "@/lib/utils";
import { WhatsappButton } from "@/components/whatsapp-button";
import { CopyFicheLinkButton } from "@/components/copy-fiche-link-button";
import { ClientPaymentsSection } from "@/components/client-payments-section";
import { ClientSessionsSection } from "@/components/client-sessions-section";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      package: true,
      sessions: {
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        include: { instructor: true, vehicle: true },
      },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!client) notFound();

  const [settings, instructors, vehicles] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.instructor.findMany({ where: { isActive: true }, orderBy: { firstName: "asc" } }),
    prisma.vehicle.findMany({ where: { isActive: true }, orderBy: { brand: "asc" } }),
  ]);

  const status = paymentStatus(client.totalPrice, client.paidAmount);
  const remaining = remainingAmount(client.totalPrice, client.paidAmount);
  const remainingSessions = Math.max(0, client.totalSessions - client.doneSessions);

  type SessionRecord = (typeof client.sessions)[number];

  const nextSession = client.sessions
    .filter(
      (s: SessionRecord) =>
        s.status === "PREVUE" && new Date(s.date) >= new Date(new Date().toDateString())
    )
    .sort((a: SessionRecord, b: SessionRecord) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Link>
        <Link
          href={`/clients/${client.id}/fiche`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
        >
          📄 Générer la fiche
        </Link>
      </div>

      {/* En-tête client */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
              {client.firstName.charAt(0)}
              {client.lastName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {client.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IdCard className="h-3.5 w-3.5" /> {client.cin}
                </span>
                {client.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {client.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${paymentStatusColor(
                status
              )}`}
            >
              {paymentStatusLabel(status)}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                client.isActive
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {client.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <WhatsappButton
            publicToken={client.publicToken}
            client={{
              firstName: client.firstName,
              lastName: client.lastName,
              whatsapp: client.whatsapp,
              licenseType: client.licenseType,
              packageName: client.package?.name ?? null,
              totalPrice: client.totalPrice,
              paidAmount: client.paidAmount,
              totalSessions: client.totalSessions,
              doneSessions: client.doneSessions,
              nextSession: nextSession
                ? {
                    date: nextSession.date.toISOString(),
                    startTime: nextSession.startTime,
                    endTime: nextSession.endTime,
                  }
                : null,
              schoolName: settings?.schoolName ?? undefined,
            }}
          />
          <CopyFicheLinkButton publicToken={client.publicToken} />
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <BookOpen className="h-4 w-4" /> Formation
          </div>
          <p className="text-sm text-slate-700">
            Permis : <span className="font-semibold">{client.licenseType}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Formule : <span className="font-semibold">{client.package?.name ?? "—"}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Début : <span className="font-semibold">{formatDate(client.startDate)}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Wallet className="h-4 w-4" /> Paiement
          </div>
          <p className="text-sm text-slate-700">
            Prix total : <span className="font-semibold">{formatCurrency(client.totalPrice)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Payé : <span className="font-semibold">{formatCurrency(client.paidAmount)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Restant :{" "}
            <span className="font-semibold text-rose-600">{formatCurrency(remaining)}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Calendar className="h-4 w-4" /> Séances
          </div>
          <p className="text-sm text-slate-700">
            Total : <span className="font-semibold">{client.totalSessions}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Effectuées : <span className="font-semibold">{client.doneSessions}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Restantes : <span className="font-semibold">{remainingSessions}</span>
          </p>
        </div>
      </div>

      {client.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 no-print">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            Notes administratives (privées — jamais envoyées au client)
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <ClientSessionsSection
        clientId={client.id}
        sessions={client.sessions.map((s: SessionRecord) => ({
          id: s.id,
          date: s.date.toISOString(),
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type,
          status: s.status,
          notes: s.notes,
          instructorName: s.instructor ? `${s.instructor.firstName} ${s.instructor.lastName}` : null,
          vehicleLabel: s.vehicle ? `${s.vehicle.brand} ${s.vehicle.model}` : null,
        }))}
        instructors={instructors}
        vehicles={vehicles}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      <ClientPaymentsSection
        clientId={client.id}
        payments={client.payments.map((p: (typeof client.payments)[number]) => ({
          id: p.id,
          amount: p.amount,
          date: p.date.toISOString(),
          method: p.method,
          reference: p.reference,
          notes: p.notes,
        }))}
        clientName={`${client.firstName} ${client.lastName}`}
      />
    </div>
  );
}
