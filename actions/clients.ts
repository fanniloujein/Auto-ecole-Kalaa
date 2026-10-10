"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clientSchema, type ClientFormValues } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

/** Frais d'inscription : mis à 0 pour toute inscription non cochée */
function registrationData(data: ClientFormValues) {
  return {
    registeredCode: data.registeredCode,
    registeredConduite: data.registeredConduite,
    registeredPark: data.registeredPark,
    feeInscriptionCode: data.registeredCode ? data.feeInscriptionCode : 0,
    feeInscriptionConduite: data.registeredConduite ? data.feeInscriptionConduite : 0,
    feeInscriptionPark: data.registeredPark ? data.feeInscriptionPark : 0,
  };
}

export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createClient(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.client.findUnique({ where: { cin: data.cin } });
    if (existing) {
      return { success: false, error: "Un client avec ce CIN existe déjà" };
    }

    const client = await prisma.client.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        cin: data.cin,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        licenseType: data.licenseType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        ...registrationData(data),
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true, data: client };
  } catch {
    return { success: false, error: "Erreur lors de la création du client" };
  }
}

export async function updateClient(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.client.findFirst({
      where: { cin: data.cin, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: "Un autre client possède déjà ce CIN" };
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        cin: data.cin,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        licenseType: data.licenseType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        ...registrationData(data),
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: client };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du client" };
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression du client" };
  }
}
