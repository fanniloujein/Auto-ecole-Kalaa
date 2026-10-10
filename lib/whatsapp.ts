import { formatCurrency, formatDate, normalizePhoneForWhatsapp } from "@/lib/utils";
import { examTypeLabels, paymentCategoryLabels, paymentCategoryOrder, sessionTypeLabels } from "@/lib/labels";
import { formatHours, type ClientAccount, type ExamProgress } from "@/lib/billing";

export interface WhatsappClientData {
  firstName: string;
  whatsapp: string;
  licenseType: string;
  account: ClientAccount;
  examProgress: ExamProgress[];
  nextSession?: {
    date: Date | string;
    startTime: string;
    endTime: string;
    type: string;
  } | null;
  nextExam?: {
    date: Date | string;
    time: string | null;
    type: string;
  } | null;
  schoolName?: string;
  currency?: string;
  /** Lien public (sans connexion requise) vers la fiche du client, généré côté client avec window.location.origin */
  ficheUrl?: string;
}

const examStatusText: Record<string, string> = {
  REUSSI: "réussi",
  PROGRAMME: "programmé",
  ECHOUE: "à repasser",
  NON_PASSE: "non passé",
};

/**
 * Construit le message WhatsApp destiné au client.
 * IMPORTANT : ne contient JAMAIS les notes internes ni les infos d'autres clients.
 */
export function buildWhatsappMessage(client: WhatsappClientData): string {
  const schoolName = client.schoolName || "notre auto-école";
  const money = (n: number) => formatCurrency(n, client.currency);
  const { account } = client;

  const lines: string[] = [];
  lines.push(`Bonjour ${client.firstName},`);
  lines.push("");
  lines.push(`Voici le point sur votre formation au permis ${client.licenseType} chez ${schoolName}.`);

  if (client.nextSession) {
    lines.push("");
    lines.push("*Prochaine séance*");
    lines.push(
      `${sessionTypeLabels[client.nextSession.type] ?? "Séance"} le ${formatDate(client.nextSession.date)}, de ${client.nextSession.startTime} à ${client.nextSession.endTime}`
    );
  }

  if (client.nextExam) {
    lines.push("");
    lines.push("*Prochain examen*");
    lines.push(
      `${examTypeLabels[client.nextExam.type]} le ${formatDate(client.nextExam.date)}${
        client.nextExam.time ? ` à ${client.nextExam.time}` : ""
      }`
    );
  }

  lines.push("");
  lines.push("*Examens*");
  for (const p of client.examProgress) {
    lines.push(`- ${examTypeLabels[p.type]} : ${examStatusText[p.status]}`);
  }

  lines.push("");
  lines.push("*Heures effectuées*");
  lines.push(
    `Conduite : ${formatHours(account.hours.conduite)} · Park : ${formatHours(account.hours.park)} · Code : ${formatHours(account.hours.code)}`
  );

  lines.push("");
  lines.push("*Situation de votre compte*");
  for (const c of paymentCategoryOrder) {
    const line = account.lines[c];
    if (line.due === 0 && line.paid === 0) continue;
    const rest =
      line.balance > 0 ? `reste ${money(line.balance)}` : line.balance < 0 ? `avance ${money(-line.balance)}` : "soldé";
    lines.push(`- ${paymentCategoryLabels[c]} : payé ${money(line.paid)} sur ${money(line.due)} (${rest})`);
  }
  lines.push(
    account.balance > 0
      ? `Total restant à payer : *${money(account.balance)}*`
      : account.balance < 0
        ? `Vous disposez d'une avance de *${money(-account.balance)}*`
        : "Votre compte est à jour."
  );

  if (client.ficheUrl) {
    lines.push("");
    lines.push(`Votre fiche complète : ${client.ficheUrl}`);
  }

  lines.push("");
  lines.push("Cordialement,");
  lines.push(schoolName);

  return lines.join("\n");
}

/** Construit l'URL wa.me prête à ouvrir avec le message pré-rempli */
export function buildWhatsappUrl(client: WhatsappClientData): string {
  const phone = normalizePhoneForWhatsapp(client.whatsapp);
  const message = buildWhatsappMessage(client);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
