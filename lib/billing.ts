// Calcul des comptes client : chaque client a un compte séparé par catégorie
// (inscription, conduite, code, examens). Le montant dû est calculé à partir
// des inscriptions, des heures effectuées et des frais d'examen ; le montant payé
// à partir des paiements affectés à chaque catégorie.

import { examTypeOrder, paymentCategoryOrder, type PaymentCategoryKey } from "@/lib/labels";

export interface Tariffs {
  priceHourConduite: number;
  priceHourCode: number;
  feeInscriptionCode: number;
  feeInscriptionConduite: number;
  feeInscriptionPark: number;
  feeRetakeCode: number;
  feeRetakePark: number;
  feeRetakeConduite: number;
}

export const defaultTariffs: Tariffs = {
  priceHourConduite: 28,
  priceHourCode: 10,
  feeInscriptionCode: 100,
  feeInscriptionConduite: 200,
  feeInscriptionPark: 200,
  feeRetakeCode: 50,
  feeRetakePark: 100,
  feeRetakeConduite: 100,
};

/** Extrait les tarifs des paramètres (valeurs par défaut si aucun paramètre enregistré) */
export function tariffsFrom(settings: Partial<Tariffs> | null | undefined): Tariffs {
  const pick = (key: keyof Tariffs) => settings?.[key] ?? defaultTariffs[key];
  return {
    priceHourConduite: pick("priceHourConduite"),
    priceHourCode: pick("priceHourCode"),
    feeInscriptionCode: pick("feeInscriptionCode"),
    feeInscriptionConduite: pick("feeInscriptionConduite"),
    feeInscriptionPark: pick("feeInscriptionPark"),
    feeRetakeCode: pick("feeRetakeCode"),
    feeRetakePark: pick("feeRetakePark"),
    feeRetakeConduite: pick("feeRetakeConduite"),
  };
}

/** Frais de repassage d'un examen (code, park ou conduite) */
export function retakeFeeFor(examType: string, tariffs: Tariffs) {
  switch (examType) {
    case "CODE":
      return tariffs.feeRetakeCode;
    case "PARK":
      return tariffs.feeRetakePark;
    case "CONDUITE":
      return tariffs.feeRetakeConduite;
    default:
      return 0;
  }
}

/** Un examen échoué ou manqué doit être repassé (et donne lieu à des frais de repassage) */
export function isFailedResult(result: string) {
  return result === "ECHOUE" || result === "ABSENT";
}

/** Tarif horaire applicable à un type de séance (le park est facturé au tarif conduite) */
export function hourlyRateFor(type: string, tariffs: Tariffs) {
  switch (type) {
    case "CONDUITE":
    case "PARK":
      return tariffs.priceHourConduite;
    case "CODE":
      return tariffs.priceHourCode;
    default:
      return 0;
  }
}

/** Durée d'une séance en heures à partir de "HH:MM" */
export function sessionHours(startTime: string, endTime: string) {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const diff = toMinutes(endTime) - toMinutes(startTime);
  return diff > 0 ? diff / 60 : 0;
}

/** Seules les séances effectuées sont facturées */
export function isBillable(status: string) {
  return status === "EFFECTUEE";
}

export function sessionAmount(s: BillingSession) {
  return isBillable(s.status) ? round(sessionHours(s.startTime, s.endTime) * s.hourlyRate) : 0;
}

function sessionCategory(type: string): PaymentCategoryKey | null {
  if (type === "CONDUITE" || type === "PARK") return "CONDUITE";
  if (type === "CODE") return "CODE";
  return null;
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

export interface BillingClient {
  registeredCode: boolean;
  registeredConduite: boolean;
  registeredPark: boolean;
  feeInscriptionCode: number;
  feeInscriptionConduite: number;
  feeInscriptionPark: number;
}

export interface BillingSession {
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
}

export interface BillingPayment {
  category: string;
  amount: number;
}

export interface BillingExam {
  type: string;
  result: string;
  fee: number;
  retakeFee: number;
  date: Date | string;
}

export interface AccountLine {
  due: number;
  paid: number;
  /** due - paid : positif = reste à payer, négatif = avance du client */
  balance: number;
}

export interface ClientAccount {
  lines: Record<PaymentCategoryKey, AccountLine>;
  totalDue: number;
  totalPaid: number;
  balance: number;
  /** Reste à payer (jamais négatif) */
  remaining: number;
  hours: { conduite: number; park: number; code: number };
}

export function computeClientAccount(
  client: BillingClient,
  sessions: BillingSession[],
  payments: BillingPayment[],
  exams: BillingExam[]
): ClientAccount {
  const due: Record<PaymentCategoryKey, number> = { INSCRIPTION: 0, CONDUITE: 0, CODE: 0, EXAMEN: 0 };
  const paid: Record<PaymentCategoryKey, number> = { INSCRIPTION: 0, CONDUITE: 0, CODE: 0, EXAMEN: 0 };
  const hours = { conduite: 0, park: 0, code: 0 };

  if (client.registeredCode) due.INSCRIPTION += client.feeInscriptionCode;
  if (client.registeredConduite) due.INSCRIPTION += client.feeInscriptionConduite;
  if (client.registeredPark) due.INSCRIPTION += client.feeInscriptionPark;

  for (const s of sessions) {
    if (!isBillable(s.status)) continue;
    const h = sessionHours(s.startTime, s.endTime);
    if (s.type === "CONDUITE") hours.conduite += h;
    else if (s.type === "PARK") hours.park += h;
    else if (s.type === "CODE") hours.code += h;
    const cat = sessionCategory(s.type);
    if (cat) due[cat] += h * s.hourlyRate;
  }

  for (const e of exams) due.EXAMEN += e.fee + e.retakeFee;

  for (const p of payments) {
    if (p.category in paid) paid[p.category as PaymentCategoryKey] += p.amount;
  }

  const lines = {} as Record<PaymentCategoryKey, AccountLine>;
  let totalDue = 0;
  let totalPaid = 0;
  for (const c of paymentCategoryOrder) {
    lines[c] = { due: round(due[c]), paid: round(paid[c]), balance: round(due[c] - paid[c]) };
    totalDue += due[c];
    totalPaid += paid[c];
  }

  const balance = round(totalDue - totalPaid);
  return {
    lines,
    totalDue: round(totalDue),
    totalPaid: round(totalPaid),
    balance,
    remaining: Math.max(0, balance),
    hours,
  };
}

export type ExamProgressStatus = "NON_PASSE" | "PROGRAMME" | "REUSSI" | "ECHOUE";

export interface ExamProgress {
  type: string;
  attempts: number;
  failures: number;
  status: ExamProgressStatus;
  passedAt: Date | string | null;
}

/** Avancement du client pour chaque examen (code, park, conduite) */
export function computeExamProgress(exams: BillingExam[]): ExamProgress[] {
  return examTypeOrder.map((type) => {
    const list = exams
      .filter((e) => e.type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const passed = list.find((e) => e.result === "REUSSI");
    const failures = list.filter((e) => e.result === "ECHOUE" || e.result === "ABSENT").length;
    const attempts = list.filter((e) => e.result !== "PROGRAMME").length;
    let status: ExamProgressStatus = "NON_PASSE";
    if (passed) status = "REUSSI";
    else if (list.some((e) => e.result === "PROGRAMME")) status = "PROGRAMME";
    else if (failures > 0) status = "ECHOUE";
    return { type, attempts, failures, status, passedAt: passed?.date ?? null };
  });
}

export function formatHours(h: number) {
  const totalMinutes = Math.round(h * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return mm === 0 ? `${hh} h` : `${hh} h ${String(mm).padStart(2, "0")}`;
}

/** Numérote les passages de chaque examen par client (1er passage, 2e passage...) */
export function attemptNumbers<
  T extends { id: string; clientId: string; type: string; date: Date | string; createdAt: Date | string },
>(exams: T[]): Map<string, number> {
  const sorted = [...exams].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime() ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const counters = new Map<string, number>();
  const result = new Map<string, number>();
  for (const e of sorted) {
    const key = `${e.clientId}:${e.type}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    result.set(e.id, n);
  }
  return result;
}
