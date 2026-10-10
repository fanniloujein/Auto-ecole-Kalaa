import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import {
  UserCheck,
  CalendarCheck,
  GraduationCap,
  Award,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Hourglass,
} from "lucide-react";
import { cn, formatCurrency, formatDate, sessionStatusColor, sessionStatusLabel } from "@/lib/utils";
import { getClientsWithAccounts } from "@/lib/accounts";
import {
  examTypeLabels,
  expenseCategoryLabels,
  paymentCategoryLabels,
  paymentCategoryOrder,
  sessionTypeLabels,
} from "@/lib/labels";
import Link from "next/link";

export default async function DashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthRange = { gte: startOfMonth, lt: startOfNextMonth };

  const [
    activeClients,
    todaySessions,
    upcomingExamsCount,
    examResults,
    monthPayments,
    monthExpenses,
    rows,
    nextSessions,
    nextExams,
  ] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.session.count({
      where: { date: { gte: startOfToday, lt: endOfToday }, status: { not: "ANNULEE" } },
    }),
    prisma.exam.count({ where: { date: { gte: startOfToday }, result: "PROGRAMME" } }),
    prisma.exam.groupBy({
      by: ["result"],
      where: { result: { in: ["REUSSI", "ECHOUE", "ABSENT"] } },
      _count: true,
    }),
    prisma.payment.groupBy({ by: ["category"], where: { date: monthRange }, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["category"], where: { date: monthRange }, _sum: { amount: true } }),
    getClientsWithAccounts(),
    prisma.session.findMany({
      where: { date: { gte: startOfToday }, status: "PREVUE" },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 6,
      include: { client: { select: { firstName: true, lastName: true } } },
    }),
    prisma.exam.findMany({
      where: { date: { gte: startOfToday }, result: "PROGRAMME" },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 6,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ]);

  const monthIncome = monthPayments.reduce((sum, p) => sum + (p._sum.amount ?? 0), 0);
  const monthSpent = monthExpenses.reduce((sum, e) => sum + (e._sum.amount ?? 0), 0);
  const monthNet = monthIncome - monthSpent;
  const outstanding = rows.reduce((sum, r) => sum + r.account.remaining, 0);

  const examsDone = examResults.reduce((sum, r) => sum + r._count, 0);
  const examsPassed = examResults.find((r) => r.result === "REUSSI")?._count ?? 0;
  const successRate = examsDone > 0 ? `${Math.round((examsPassed / examsDone) * 100)} %` : "—";

  const incomeByCategory = new Map(monthPayments.map((p) => [p.category, p._sum.amount ?? 0]));
  const expensesByCategory = monthExpenses
    .map((e) => ({ category: e.category, amount: e._sum.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);

  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Vue d&apos;ensemble de votre auto-école</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Clients actifs" value={activeClients} icon={UserCheck} accent="blue" />
        <StatCard label="Séances aujourd'hui" value={todaySessions} icon={CalendarCheck} accent="amber" />
        <StatCard label="Examens à venir" value={upcomingExamsCount} icon={GraduationCap} accent="blue" />
        <StatCard
          label="Taux de réussite"
          value={successRate}
          icon={Award}
          accent="emerald"
          hint={`${examsPassed} réussite${examsPassed > 1 ? "s" : ""} sur ${examsDone} passage${examsDone > 1 ? "s" : ""}`}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Finances — {monthName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Encaissements du mois"
            value={formatCurrency(monthIncome)}
            icon={ArrowDownCircle}
            accent="emerald"
          />
          <StatCard
            label="Dépenses du mois"
            value={formatCurrency(monthSpent)}
            icon={ArrowUpCircle}
            accent="rose"
          />
          <StatCard
            label="Résultat net du mois"
            value={formatCurrency(monthNet)}
            icon={Scale}
            accent={monthNet >= 0 ? "emerald" : "rose"}
            hint="Encaissements − dépenses"
          />
          <StatCard
            label="Reste à percevoir"
            value={formatCurrency(outstanding)}
            icon={Hourglass}
            accent="amber"
            hint="Tous clients confondus"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Encaissements du mois par compte</h2>
            <Link href="/paiements" className="text-sm text-blue-700 font-medium hover:underline">
              Paiements
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {paymentCategoryOrder.map((c) => (
              <div key={c} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-600">{paymentCategoryLabels[c]}</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(incomeByCategory.get(c) ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Dépenses du mois par catégorie</h2>
            <Link href="/depenses" className="text-sm text-blue-700 font-medium hover:underline">
              Dépenses
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {expensesByCategory.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">Aucune dépense ce mois-ci.</p>
            )}
            {expensesByCategory.map((e) => (
              <div key={e.category} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-600">{expenseCategoryLabels[e.category]}</span>
                <span className="font-medium text-rose-600">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Prochaines séances</h2>
            <Link href="/planning" className="text-sm text-blue-700 font-medium hover:underline">
              Planning
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {nextSessions.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">Aucune séance prévue.</p>
            )}
            {nextSessions.map((s: (typeof nextSessions)[number]) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {s.client.firstName} {s.client.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {sessionTypeLabels[s.type]} · {formatDate(s.date)} · {s.startTime} - {s.endTime}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full border ${sessionStatusColor(
                    s.status
                  )}`}
                >
                  {sessionStatusLabel(s.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Prochains examens</h2>
            <Link href="/examens" className="text-sm text-blue-700 font-medium hover:underline">
              Examens
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {nextExams.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">Aucun examen programmé.</p>
            )}
            {nextExams.map((e: (typeof nextExams)[number]) => (
              <Link
                key={e.id}
                href={`/clients/${e.client.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {e.client.firstName} {e.client.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{examTypeLabels[e.type]}</p>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-slate-600 whitespace-nowrap",
                    e.date < endOfToday && "text-amber-700"
                  )}
                >
                  {formatDate(e.date)}
                  {e.time ? ` · ${e.time}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
