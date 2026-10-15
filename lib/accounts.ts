import { prisma } from "@/lib/prisma";
import {
  attemptNumbers,
  computeClientAccount,
  computeExamProgress,
  type ClientAccount,
  type ExamProgress,
} from "@/lib/billing";

const billingInclude = {
  sessions: {
    where: { status: "EFFECTUEE" as const },
    select: { type: true, status: true, startTime: true, endTime: true, hourlyRate: true },
  },
  payments: { select: { category: true, amount: true } },
  exams: { select: { type: true, result: true, fee: true, retakeFee: true, date: true } },
};

/** Charge tous les clients avec leur compte calculé et leur avancement aux examens */
export async function getClientsWithAccounts() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: billingInclude,
  });

  return clients.map((c: (typeof clients)[number]) => {
    const { sessions, payments, exams, ...client } = c;
    const account: ClientAccount = computeClientAccount(c, sessions, payments, exams);
    const examProgress: ExamProgress[] = computeExamProgress(exams);
    return { client, account, examProgress };
  });
}

/** Charge un client avec tout son dossier : séances, paiements, examens, compte calculé */
export async function getClientDossier(where: { id: string } | { publicToken: string }) {
  const client = await prisma.client.findUnique({
    where,
    include: {
      sessions: {
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        include: { instructor: true, vehicle: true },
      },
      payments: { orderBy: { date: "desc" } },
      exams: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!client) return null;

  type SessionRecord = (typeof client.sessions)[number];
  type ExamRecord = (typeof client.exams)[number];

  const account = computeClientAccount(client, client.sessions, client.payments, client.exams);
  const examProgress = computeExamProgress(client.exams);
  const attempts = attemptNumbers(client.exams);

  const startOfToday = new Date(new Date().toDateString());
  const nextSession =
    client.sessions
      .filter((s: SessionRecord) => s.status === "PREVUE" && s.date >= startOfToday)
      .sort(
        (a: SessionRecord, b: SessionRecord) =>
          a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime)
      )[0] ?? null;
  const nextExam =
    client.exams
      .filter((e: ExamRecord) => e.result === "PROGRAMME" && e.date >= startOfToday)
      .sort((a: ExamRecord, b: ExamRecord) => a.date.getTime() - b.date.getTime())[0] ?? null;

  return { client, account, examProgress, attempts, nextSession, nextExam };
}
