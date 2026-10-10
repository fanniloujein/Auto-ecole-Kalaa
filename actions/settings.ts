"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vehicleSchema, instructorSchema, settingsSchema, tariffsSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

// ---------- Véhicules ----------

export async function createVehicle(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const vehicle = await prisma.vehicle.create({
      data: { ...parsed.data, isActive: parsed.data.isActive ?? true },
    });
    revalidatePath("/parametres");
    return { success: true, data: vehicle };
  } catch {
    return { success: false, error: "Erreur : immatriculation déjà utilisée ?" };
  }
}

export async function updateVehicle(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { ...parsed.data, isActive: parsed.data.isActive ?? true },
    });
    revalidatePath("/parametres");
    return { success: true, data: vehicle };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du véhicule" };
  }
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.vehicle.delete({ where: { id } });
    revalidatePath("/parametres");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer ce véhicule" };
  }
}

// ---------- Moniteurs ----------

export async function createInstructor(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = instructorSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const instructor = await prisma.instructor.create({
      data: { ...parsed.data, isActive: parsed.data.isActive ?? true },
    });
    revalidatePath("/parametres");
    return { success: true, data: instructor };
  } catch {
    return { success: false, error: "Erreur lors de la création du moniteur" };
  }
}

export async function updateInstructor(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = instructorSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const instructor = await prisma.instructor.update({
      where: { id },
      data: { ...parsed.data, isActive: parsed.data.isActive ?? true },
    });
    revalidatePath("/parametres");
    return { success: true, data: instructor };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du moniteur" };
  }
}

export async function deleteInstructor(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.instructor.delete({ where: { id } });
    revalidatePath("/parametres");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer ce moniteur" };
  }
}

// ---------- Paramètres généraux ----------

export async function updateSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const existing = await prisma.settings.findFirst();
    const data = {
      schoolName: parsed.data.schoolName,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      currency: parsed.data.currency,
    };
    const settings = existing
      ? await prisma.settings.update({ where: { id: existing.id }, data })
      : await prisma.settings.create({ data });

    revalidatePath("/parametres");
    revalidatePath("/dashboard");
    return { success: true, data: settings };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour des paramètres" };
  }
}

// ---------- Tarifs ----------

export async function updateTariffs(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = tariffsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  try {
    const existing = await prisma.settings.findFirst();
    const settings = existing
      ? await prisma.settings.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.settings.create({ data: parsed.data });

    revalidatePath("/parametres");
    revalidatePath("/clients");
    return { success: true, data: settings };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour des tarifs" };
  }
}
