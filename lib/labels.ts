// Libellés et couleurs partagés (types de séance, examens, catégories de paiement et de dépense)

export const licenseTypes = ["A", "A1", "B", "C", "D", "BE", "CE"] as const;

export const sessionTypeLabels: Record<string, string> = {
  CONDUITE: "Conduite",
  PARK: "Park (manœuvres)",
  CODE: "Code",
  AUTRE: "Autre",
};

export const examTypeLabels: Record<string, string> = {
  CODE: "Examen du code",
  PARK: "Examen du park",
  CONDUITE: "Examen de conduite",
};

/** Ordre officiel de passage des examens */
export const examTypeOrder = ["CODE", "PARK", "CONDUITE"] as const;

export const examResultLabels: Record<string, string> = {
  PROGRAMME: "Programmé",
  REUSSI: "Réussi",
  ECHOUE: "Échoué",
  ABSENT: "Absent",
};

export function examResultColor(result: string) {
  switch (result) {
    case "REUSSI":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ECHOUE":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "ABSENT":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

export const paymentCategoryLabels: Record<string, string> = {
  INSCRIPTION: "Inscription",
  CONDUITE: "Conduite",
  CODE: "Code",
  EXAMEN: "Examens",
};

export const paymentCategoryOrder = ["INSCRIPTION", "CONDUITE", "CODE", "EXAMEN"] as const;
export type PaymentCategoryKey = (typeof paymentCategoryOrder)[number];

export const paymentMethodLabels: Record<string, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  CARTE: "Carte",
  AUTRE: "Autre",
};

export const expenseCategoryLabels: Record<string, string> = {
  CARBURANT: "Carburant",
  ENTRETIEN: "Entretien véhicules",
  ASSURANCE: "Assurance",
  SALAIRE: "Salaires",
  LOYER: "Loyer",
  FACTURES: "Factures (eau, électricité, internet)",
  FRAIS_EXAMEN: "Frais d'examen",
  TAXES: "Impôts & taxes",
  FOURNITURES: "Fournitures",
  AUTRE: "Autre",
};
