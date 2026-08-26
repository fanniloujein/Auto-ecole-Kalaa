import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { Users, UserCheck, CalendarCheck, CalendarClock, Wallet, ListChecks } from "lucide-react";
import { formatCurrency, formatDate, sessionStatusColor, sessionStatusLabel } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    totalClients,
    activeClients,
    todaySessions,
    upcomingSessions,
    payments,
    clients,
    remainingSessionsAgg,
    latestClients,
    nextSessions,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true } }),
    prisma.session.count({
      where: { date: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.session.count({
      where: { date: { gte: endOfToday }, status: "PREVUE" },
    }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.client.findMany({ select: { totalSessions: true, doneSessions: true } }),
    prisma.client.aggregate({ _sum: { totalSessions: true, doneSessions: true } }),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, licenseType: true, createdAt: true },
    }),
    prisma.session.findMany({
      where: { date: { gte: startOfToday }, status: "PREVUE" },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 6,
      include: { client: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const remainingSessions =
    (remainingSessionsAgg._sum.totalSessions ?? 0) - (remainingSessionsAgg._sum.doneSessions ?? 0);

  void clients;

  const totalRevenue = payments._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Vue d&apos;ensemble de votre auto-école</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total clients" value={totalClients} icon={Users} accent="blue" />
        <StatCard label="Clients actifs" value={activeClients} icon={UserCheck} accent="emerald" />
        <StatCard label="Séances aujourd'hui" value={todaySessions} icon={CalendarCheck} accent="amber" />
        <StatCard
          label="Séances à venir"
          value={upcomingSessions}
          icon={CalendarClock}
          accent="blue"
        />
        <StatCard
          label="Revenus totaux"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard
          label="Séances restantes"
          value={Math.max(0, remainingSessions)}
          icon={ListChecks}
          accent="rose"
          hint="Toutes formations confondues"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Derniers clients ajoutés</h2>
            <Link href="/clients" className="text-sm text-blue-700 font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestClients.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">Aucun client pour le moment.</p>
            )}
            {latestClients.map((c: (typeof latestClients)[number]) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                    {c.firstName.charAt(0)}
                    {c.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-slate-400">Permis {c.licenseType}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
              </Link>
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
                    {formatDate(s.date)} · {s.startTime} - {s.endTime}
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
      </div>
    </div>
  );
}
