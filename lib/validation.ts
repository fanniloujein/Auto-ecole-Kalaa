import { z } from "zod";

export const licenseTypeEnum = z.enum(["A", "A1", "B", "C", "D", "BE", "CE"]);
export const sessionStatusEnum = z.enum(["PREVUE", "EFFECTUEE", "ANNULEE", "ABSENCE"]);
export const sessionTypeEnum = z.enum(["CONDUITE", "CODE", "EXAMEN_BLANC", "AUTRE"]);
export const paymentMethodEnum = z.enum(["ESPECES", "VIREMENT", "CHEQUE", "CARTE", "AUTRE"]);

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
  packageId: z.string().optional().nullable(),
  totalSessions: z.coerce.number().int().min(0),
  doneSessions: z.coerce.number().int().min(0),
  totalPrice: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const sessionSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  date: z.string().min(1, "La date est requise"),
  startTime: z.string().min(1, "L'heure de début est requise"),
  endTime: z.string().min(1, "L'heure de fin est requise"),
  type: sessionTypeEnum,
  status: sessionStatusEnum,
  instructorId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;

export const paymentSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est requise"),
  method: paymentMethodEnum,
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const packageSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  sessionsCount: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean().optional(),
});

export type PackageFormValues = z.infer<typeof packageSchema>;

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

export type SettingsFormValues = z.infer<typeof settingsSchema>;
