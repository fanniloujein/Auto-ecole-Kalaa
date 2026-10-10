import { Car } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  examResultLabels,
  examTypeLabels,
  paymentCategoryLabels,
  paymentMethodLabels,
  sessionTypeLabels,
} from "@/lib/labels";
import { formatHours } from "@/lib/billing";
import type { getClientDossier } from "@/lib/accounts";
import { AccountStatement } from "@/components/account-statement";
import { ExamSteps } from "@/components/exam-steps";

type Dossier = NonNullable<Awaited<ReturnType<typeof getClientDossier>>>;

interface SchoolInfo {
  schoolName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * Fiche client imprimable (PDF via l'impression du navigateur).
 * Ne contient jamais les notes administratives internes.
 */
export function ClientFiche({ dossier, school }: { dossier: Dossier; school: SchoolInfo | null }) {
  const { client, account, examProgress, attempts, nextSession, nextExam } = dossier;
  const schoolName = school?.schoolName ?? "Auto-École";

  const inscriptions = [
    client.registeredCode && { label: "Code", fee: client.feeInscriptionCode },
    client.registeredPark && { label: "Park", fee: client.feeInscriptionPark },
    client.registeredConduite && { label: "Conduite", fee: client.feeInscriptionConduite },
  ].filter((x): x is { label: string; fee: number } => !!x);

  const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3";

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg print:shadow-none print:rounded-none p-8 sm:p-10 text-slate-800">
      <div className="flex items-start justify-between border-b-2 border-blue-700 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-lg text-slate-900">{schoolName}</p>
            {school?.address && <p className="text-xs text-slate-500">{school.address}</p>}
            <p className="text-xs text-slate-500">
              {[school?.phone, school?.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">Fiche client</p>
          <p className="text-xs text-slate-500">Éditée le {formatDate(new Date())}</p>
        </div>
      </div>

      <section className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-3">
          {client.firstName} {client.lastName}
        </h1>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">CIN</dt>
            <dd className="font-medium">{client.cin}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Téléphone</dt>
            <dd className="font-medium">{client.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Permis</dt>
            <dd className="font-medium">{client.licenseType}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Inscrit le</dt>
            <dd className="font-medium">{formatDate(client.registrationDate)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-slate-200 pt-5 mb-6">
        <h2 className={sectionTitle}>Inscriptions</h2>
        {inscriptions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune inscription enregistrée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inscriptions.map((i) => (
              <span key={i.label} className="text-sm rounded-lg border border-slate-200 px-3 py-1.5">
                {i.label} — <span className="font-medium">{formatCurrency(i.fee)}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 pt-5 mb-6 break-inside-avoid">
        <h2 className={sectionTitle}>Parcours d&apos;examens</h2>
        <ExamSteps progress={examProgress} />
        {client.exams.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-1.5 font-medium">Examen</th>
                <th className="text-left py-1.5 font-medium">Passage</th>
                <th className="text-left py-1.5 font-medium">Date</th>
                <th className="text-right py-1.5 font-medium">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.exams.map((e: Dossier["client"]["exams"][number]) => (
                <tr key={e.id}>
                  <td className="py-1.5">{examTypeLabels[e.type]}</td>
                  <td className="py-1.5">n° {attempts.get(e.id) ?? 1}</td>
                  <td className="py-1.5">
                    {formatDate(e.date)}
                    {e.time ? ` à ${e.time}` : ""}
                  </td>
                  <td className="py-1.5 text-right font-medium">{examResultLabels[e.result]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="border-t border-slate-200 pt-5 mb-6">
        <h2 className={sectionTitle}>Heures de formation effectuées</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["Conduite", account.hours.conduite],
            ["Park", account.hours.park],
            ["Code", account.hours.code],
          ].map(([label, h]) => (
            <div key={label as string} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold">{formatHours(h as number)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-5 mb-6 break-inside-avoid">
        <h2 className={sectionTitle}>Relevé de compte</h2>
        <AccountStatement account={account} />
      </section>

      {client.payments.length > 0 && (
        <section className="border-t border-slate-200 pt-5 mb-6 break-inside-avoid">
          <h2 className={sectionTitle}>Historique des paiements</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-1.5 font-medium">Date</th>
                <th className="text-left py-1.5 font-medium">Compte</th>
                <th className="text-left py-1.5 font-medium">Mode</th>
                <th className="text-right py-1.5 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.payments.map((p: Dossier["client"]["payments"][number]) => (
                <tr key={p.id}>
                  <td className="py-1.5">{formatDate(p.date)}</td>
                  <td className="py-1.5">{paymentCategoryLabels[p.category]}</td>
                  <td className="py-1.5">{paymentMethodLabels[p.method]}</td>
                  <td className="py-1.5 text-right font-medium">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(nextSession || nextExam) && (
        <section className="border-t border-slate-200 pt-5 mb-6">
          <h2 className={sectionTitle}>Prochains rendez-vous</h2>
          <div className="space-y-1 text-sm">
            {nextSession && (
              <p>
                <span className="text-slate-500">Séance de {sessionTypeLabels[nextSession.type]?.toLowerCase()} :</span>{" "}
                <span className="font-medium">
                  {formatDate(nextSession.date)}, {nextSession.startTime} - {nextSession.endTime}
                </span>
              </p>
            )}
            {nextExam && (
              <p>
                <span className="text-slate-500">{examTypeLabels[nextExam.type]} :</span>{" "}
                <span className="font-medium">
                  {formatDate(nextExam.date)}
                  {nextExam.time ? ` à ${nextExam.time}` : ""}
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      <div className="border-t border-slate-200 pt-4 mt-8 text-center text-xs text-slate-400">
        {schoolName} — Document édité le {formatDate(new Date())}. Merci de votre confiance.
      </div>
    </div>
  );
}
