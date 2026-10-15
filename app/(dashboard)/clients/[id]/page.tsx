import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, IdCard, Wallet, BookOpen, Clock, FileText } from "lucide-react";
import { formatCurrency, formatDate, paymentStatus, paymentStatusColor, paymentStatusLabel } from "@/lib/utils";
import { formatHours, retakeFeeFor, sessionAmount, tariffsFrom } from "@/lib/billing";
import { examTypeOrder } from "@/lib/labels";
import { getClientDossier } from "@/lib/accounts";
import { WhatsappButton } from "@/components/whatsapp-button";
import { CopyFicheLinkButton } from "@/components/copy-fiche-link-button";
import { EditClientButton } from "@/components/edit-client-button";
import { ClientPaymentsSection } from "@/components/client-payments-section";
import { ClientSessionsSection } from "@/components/client-sessions-section";
import { ExamsManager } from "@/components/exams-manager";
import { AccountStatement } from "@/components/account-statement";
import { ExamSteps } from "@/components/exam-steps";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dossier = await getClientDossier({ id });
  if (!dossier) notFound();
  const { client, account, examProgress, attempts, nextSession, nextExam } = dossier;

  const [settings, instructors, vehicles] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.instructor.findMany({ where: { isActive: true }, orderBy: { firstName: "asc" } }),
    prisma.vehicle.findMany({ where: { isActive: true }, orderBy: { brand: "asc" } }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessions, payments, exams, ...clientFields } = client;
  const tariffs = tariffsFrom(settings);
  const retakeFees = Object.fromEntries(examTypeOrder.map((t) => [t, retakeFeeFor(t, tariffs)]));
  const status = paymentStatus(account.totalDue, account.totalPaid);
  const clientName = `${client.firstName} ${client.lastName}`;
  const inscriptions = [
    client.registeredCode && `Code (${formatCurrency(client.feeInscriptionCode)})`,
    client.registeredPark && `Park (${formatCurrency(client.feeInscriptionPark)})`,
    client.registeredConduite && `Conduite (${formatCurrency(client.feeInscriptionConduite)})`,
  ].filter(Boolean);

  type SessionRecord = (typeof client.sessions)[number];
  type ExamRecord = (typeof client.exams)[number];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Link>
        <div className="flex flex-wrap gap-2">
          <EditClientButton
            tariffs={tariffs}
            client={{
              ...clientFields,
              birthDate: client.birthDate?.toISOString() ?? null,
              startDate: client.startDate?.toISOString() ?? null,
              registrationDate: client.registrationDate.toISOString(),
              createdAt: client.createdAt.toISOString(),
              updatedAt: client.updatedAt.toISOString(),
            }}
          />
          <Link
            href={`/clients/${client.id}/fiche`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            Fiche client (PDF)
          </Link>
        </div>
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
              <h1 className="text-xl font-bold text-slate-900">{clientName}</h1>
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
              whatsapp: client.whatsapp,
              licenseType: client.licenseType,
              account,
              examProgress,
              nextSession: nextSession
                ? {
                    date: nextSession.date.toISOString(),
                    startTime: nextSession.startTime,
                    endTime: nextSession.endTime,
                    type: nextSession.type,
                  }
                : null,
              nextExam: nextExam
                ? { date: nextExam.date.toISOString(), time: nextExam.time, type: nextExam.type }
                : null,
              schoolName: settings?.schoolName ?? undefined,
              currency: settings?.currency ?? undefined,
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
            Inscrit le : <span className="font-semibold">{formatDate(client.registrationDate)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Inscriptions :{" "}
            <span className="font-semibold">
              {inscriptions.length > 0 ? inscriptions.join(", ") : "aucune"}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Clock className="h-4 w-4" /> Heures effectuées
          </div>
          <p className="text-sm text-slate-700">
            Conduite : <span className="font-semibold">{formatHours(account.hours.conduite)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Park : <span className="font-semibold">{formatHours(account.hours.park)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Code : <span className="font-semibold">{formatHours(account.hours.code)}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
            <Wallet className="h-4 w-4" /> Situation financière
          </div>
          <p className="text-sm text-slate-700">
            Total dû : <span className="font-semibold">{formatCurrency(account.totalDue)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Total payé : <span className="font-semibold">{formatCurrency(account.totalPaid)}</span>
          </p>
          <p className="text-sm text-slate-700 mt-1">
            {account.balance >= 0 ? "Reste à payer" : "Avance"} :{" "}
            <span
              className={`font-semibold ${account.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}
            >
              {formatCurrency(Math.abs(account.balance))}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Parcours d&apos;examens</h2>
        <ExamSteps progress={examProgress} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Relevé de compte</h2>
        <AccountStatement account={account} />
      </div>

      {client.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 no-print">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            Notes administratives (privées — jamais envoyées au client)
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <ExamsManager
        clientId={client.id}
        retakeFees={retakeFees}
        exams={client.exams.map((e: ExamRecord) => ({
          id: e.id,
          clientId: e.clientId,
          clientName,
          type: e.type,
          date: e.date.toISOString(),
          time: e.time,
          result: e.result,
          fee: e.fee,
          retakeFee: e.retakeFee,
          location: e.location,
          notes: e.notes,
          attempt: attempts.get(e.id) ?? 1,
        }))}
      />

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
          amount: sessionAmount(s),
          instructorId: s.instructorId,
          instructorName: s.instructor ? `${s.instructor.firstName} ${s.instructor.lastName}` : null,
          vehicleId: s.vehicleId,
          vehicleLabel: s.vehicle ? `${s.vehicle.brand} ${s.vehicle.model}` : null,
        }))}
        instructors={instructors}
        vehicles={vehicles}
        clientName={clientName}
      />

      <ClientPaymentsSection
        clientId={client.id}
        account={{ lines: account.lines, details: account.details }}
        payments={client.payments.map((p: (typeof client.payments)[number]) => ({
          id: p.id,
          amount: p.amount,
          date: p.date.toISOString(),
          category: p.category,
          detail: p.detail,
          method: p.method,
          reference: p.reference,
          notes: p.notes,
        }))}
        clientName={clientName}
      />
    </div>
  );
}
