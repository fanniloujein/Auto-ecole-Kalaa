import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = "TND") {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Normalise un numéro de téléphone pour wa.me (chiffres uniquement, avec indicatif pays) */
export function normalizePhoneForWhatsapp(phone: string, defaultCountryCode = "216") {
  const digits = phone.replace(/[^\d+]/g, "");
  const cleaned = digits.replace(/^\+/, "");
  if (cleaned.startsWith(defaultCountryCode)) return cleaned;
  if (cleaned.startsWith("0")) return `${defaultCountryCode}${cleaned.slice(1)}`;
  return `${defaultCountryCode}${cleaned}`;
}

export function remainingAmount(totalPrice: number, paidAmount: number) {
  return Math.max(0, totalPrice - paidAmount);
}

export type PaymentStatusLabel = "PAYE" | "PARTIEL" | "NON_PAYE";

export function paymentStatus(totalPrice: number, paidAmount: number): PaymentStatusLabel {
  if (paidAmount <= 0) return "NON_PAYE";
  if (paidAmount >= totalPrice) return "PAYE";
  return "PARTIEL";
}

export function paymentStatusLabel(status: PaymentStatusLabel) {
  switch (status) {
    case "PAYE":
      return "Payé";
    case "PARTIEL":
      return "Partiellement payé";
    default:
      return "Non payé";
  }
}

export function paymentStatusColor(status: PaymentStatusLabel) {
  switch (status) {
    case "PAYE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PARTIEL":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-rose-100 text-rose-700 border-rose-200";
  }
}

export function sessionStatusLabel(status: string) {
  switch (status) {
    case "PREVUE":
      return "Prévue";
    case "EFFECTUEE":
      return "Effectuée";
    case "ANNULEE":
      return "Annulée";
    case "ABSENCE":
      return "Absence";
    default:
      return status;
  }
}

export function sessionStatusColor(status: string) {
  switch (status) {
    case "PREVUE":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "EFFECTUEE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ANNULEE":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "ABSENCE":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}
