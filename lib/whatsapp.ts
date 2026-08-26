import { formatCurrency, formatDate, normalizePhoneForWhatsapp, remainingAmount } from "@/lib/utils";

export interface WhatsappClientData {
  firstName: string;
  lastName: string;
  whatsapp: string;
  licenseType: string;
  packageName?: string | null;
  totalPrice: number;
  paidAmount: number;
  totalSessions: number;
  doneSessions: number;
  nextSession?: {
    date: Date | string;
    startTime: string;
    endTime: string;
  } | null;
  schoolName?: string;
  /** Lien public (sans connexion requise) vers la fiche du client, généré côté client avec window.location.origin */
  ficheUrl?: string;
}

/**
 * Construit le message WhatsApp destiné au client.
 * IMPORTANT : ne contient JAMAIS les notes internes ni les infos d'autres clients.
 */
export function buildWhatsappMessage(client: WhatsappClientData): string {
  const remaining = remainingAmount(client.totalPrice, client.paidAmount);
  const remainingSessions = Math.max(0, client.totalSessions - client.doneSessions);
  const schoolName = client.schoolName || "notre auto-école";

  const lines: string[] = [];
  lines.push(`Bonjour ${client.firstName},`);
  lines.push("");
  lines.push(`Voici les informations concernant votre formation à ${schoolName} :`);
  lines.push("");
  lines.push(`🚗 Permis : ${client.licenseType}`);
  if (client.packageName) {
    lines.push(`📦 Formule : ${client.packageName}`);
  }

  if (client.nextSession) {
    lines.push("");
    lines.push("📅 Prochaine séance :");
    lines.push(`Date : ${formatDate(client.nextSession.date)}`);
    lines.push(`Heure : ${client.nextSession.startTime}`);
    lines.push(`Durée : ${client.nextSession.startTime} - ${client.nextSession.endTime}`);
  }

  lines.push("");
  lines.push("💰 Formation :");
  lines.push(`Prix total : ${formatCurrency(client.totalPrice)}`);
  lines.push(`Montant payé : ${formatCurrency(client.paidAmount)}`);
  lines.push(`Montant restant : ${formatCurrency(remaining)}`);

  lines.push("");
  lines.push("📚 Séances :");
  lines.push(`Total : ${client.totalSessions}`);
  lines.push(`Effectuées : ${client.doneSessions}`);
  lines.push(`Restantes : ${remainingSessions}`);

  lines.push("");
  lines.push("Merci et à bientôt.");

  if (client.ficheUrl) {
    lines.push("");
    lines.push(`📄 Voir / télécharger votre fiche complète : ${client.ficheUrl}`);
  }

  return lines.join("\n");
}

/** Construit l'URL wa.me prête à ouvrir avec le message pré-rempli */
export function buildWhatsappUrl(client: WhatsappClientData): string {
  const phone = normalizePhoneForWhatsapp(client.whatsapp);
  const message = buildWhatsappMessage(client);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
