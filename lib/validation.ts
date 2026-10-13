import { z } from "zod";

export const licenseTypeEnum = z.enum(["A", "A1", "B", "C", "D", "BE", "CE"]);
export const sessionStatusEnum = z.enum(["PREVUE", "EFFECTUEE", "ANNULEE", "ABSENCE"]);
export const sessionTypeEnum = z.enum(["CONDUITE", "PARK", "CODE", "AUTRE"]);
export const paymentMethodEnum = z.enum(["ESPECES", "VIREMENT", "CHEQUE", "CARTE", "AUTRE"]);
export const paymentCategoryEnum = z.enum(["INSCRIPTION", "CONDUITE", "CODE", "EXAMEN"]);
export const examTypeEnum = z.enum(["CODE", "PARK", "CONDUITE"]);
export const examResultEnum = z.enum(["PROGRAMME", "REUSSI", "ECHOUE", "ABSENT"]);
export const expenseCategoryEnum = z.enum([
  "CARBURANT",
  "ENTRETIEN",
  "ASSURANCE",
  "SALAIRE",
  "LOYER",
  "FACTURES",
  "FRAIS_EXAMEN",
  "TAXES",
  "FOURNITURES",
  "AUTRE",
]);

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide (HH:MM)");

export const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
  whatsapp: z.string().min(6, "Numéro WhatsApp invalide"),
  cin: z.string().min(1, "Le CIN est requis"),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  licenseType: licenseTypeEnum,
  startDate: z.string().optional().nullable(),
  registeredCode: z.coerce.boolean(),
  registeredConduite: z.coerce.boolean(),
  registeredPark: z.coerce.boolean(),
  feeInscriptionCode: z.coerce.number().min(0, "Montant invalide"),
  feeInscriptionConduite: z.coerce.number().min(0, "Montant invalide"),
  feeInscriptionPark: z.coerce.number().min(0, "Montant invalide"),
  notes: z.string().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const sessionSchema = z
  .object({
    clientId: z.string().min(1, "Le client est requis"),
    date: z.string().min(1, "La date est requise"),
    startTime: timeString,
    endTime: timeString,
    type: sessionTypeEnum,
    status: sessionStatusEnum,
    instructorId: z.string().optional().nullable(),
    vehicleId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((s) => s.endTime > s.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
  });

export type SessionFormValues = z.infer<typeof sessionSchema>;

export const paymentSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est requise"),
  category: paymentCategoryEnum,
  method: paymentMethodEnum,
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const examSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  type: examTypeEnum,
  date: z.string().min(1, "La date est requise"),
  time: z.string().optional().nullable(),
  result: examResultEnum,
  fee: z.coerce.number().min(0, "Montant invalide"),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ExamFormValues = z.infer<typeof examSchema>;

export const expenseSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  category: expenseCategoryEnum,
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est requise"),
  method: paymentMethodEnum,
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const vehicleSchema = z.object({
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  plateNumber: z.string().min(1, "L'immatriculation est requise"),
  licenseType: licenseTypeEnum,
  isActive: z.coerce.boolean().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const instructorSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export type InstructorFormValues = z.infer<typeof instructorSchema>;

export const settingsSchema = z.object({
  schoolName: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  currency: z.string().min(1),
});

export const tariffsSchema = z.object({
  priceHourConduite: z.coerce.number().min(0, "Montant invalide"),
  priceHourCode: z.coerce.number().min(0, "Montant invalide"),
  feeInscriptionCode: z.coerce.number().min(0, "Montant invalide"),
  feeInscriptionConduite: z.coerce.number().min(0, "Montant invalide"),
  feeInscriptionPark: z.coerce.number().min(0, "Montant invalide"),
  feeRetakeCode: z.coerce.number().min(0, "Montant invalide"),
  feeRetakePark: z.coerce.number().min(0, "Montant invalide"),
  feeRetakeConduite: z.coerce.number().min(0, "Montant invalide"),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export type TariffsFormValues = z.infer<typeof tariffsSchema>;
