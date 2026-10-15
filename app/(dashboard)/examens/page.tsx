import { prisma } from "@/lib/prisma";
import { ExamsManager } from "@/components/exams-manager";
import { attemptNumbers, retakeFeeFor, tariffsFrom } from "@/lib/billing";
import { examTypeLabels, examTypeOrder } from "@/lib/labels";

export default async function ExamensPage() {
  const [exams, clients, settings] = await Promise.all([
    prisma.exam.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { client: { select: { firstName: true, lastName: true } } },
    }),
    prisma.client.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.settings.findFirst(),
  ]);

  const tariffs = tariffsFrom(settings);
  const retakeFees = Object.fromEntries(examTypeOrder.map((t) => [t, retakeFeeFor(t, tariffs)]));

  const attempts = attemptNumbers(exams);

  // Taux de réussite par examen (sur les passages ayant un résultat)
  const stats = examTypeOrder.map((type) => {
    const done = exams.filter(
      (e: (typeof exams)[number]) => e.type === type && e.result !== "PROGRAMME"
    );
    const passed = done.filter((e: (typeof exams)[number]) => e.result === "REUSSI").length;
    const upcoming = exams.filter(
      (e: (typeof exams)[number]) => e.type === type && e.result === "PROGRAMME"
    ).length;
    return {
      type,
      passed,
      failed: done.length - passed,
      upcoming,
      rate: done.length > 0 ? Math.round((passed / done.length) * 100) : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Examens</h1>
        <p className="text-slate-500 text-sm mt-1">
          Examens du code, du park et de conduite — chaque échec permet un nouveau passage
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.type} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500 font-medium">{examTypeLabels[s.type]}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {s.rate === null ? "—" : `${s.rate} %`}
              <span className="text-xs font-medium text-slate-400 ml-2">de réussite</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {s.passed} réussi{s.passed > 1 ? "s" : ""} · {s.failed} échec{s.failed > 1 ? "s" : ""} ·{" "}
              {s.upcoming} programmé{s.upcoming > 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      <ExamsManager
        exams={exams.map((e: (typeof exams)[number]) => ({
          id: e.id,
          clientId: e.clientId,
          clientName: `${e.client.firstName} ${e.client.lastName}`,
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
        clients={clients}
        retakeFees={retakeFees}
      />
    </div>
  );
}
