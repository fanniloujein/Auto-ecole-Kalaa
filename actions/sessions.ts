"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sessionSchema } from "@/lib/validation";
import { hourlyRateFor, tariffsFrom } from "@/lib/billing";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

async function currentRate(type: string) {
  const settings = await prisma.settings.findFirst();
  return hourlyRateFor(type, tariffsFrom(settings));
}

function revalidateSessionPages(clientId: string) {
  revalidatePath("/seances");
  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/paiements");
  revalidatePath(`/clients/${clientId}`);
}

export async function createSession(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const created = await prisma.session.create({
      data: {
        clientId: data.clientId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        hourlyRate: await currentRate(data.type),
        instructorId: data.instructorId || null,
        vehicleId: data.vehicleId || null,
        notes: data.notes || null,
      },
    });

    revalidateSessionPages(data.clientId);
    return { success: true, data: created };
  } catch {
    return { success: false, error: "Erreur lors de la création de la séance" };
  }
}

export async function updateSession(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const previous = await prisma.session.findUnique({ where: { id } });
    if (!previous) return { success: false, error: "Séance introuvable" };

    // Le tarif reste celui de la création, sauf si le type de séance change
    const hourlyRate =
      previous.type === data.type ? previous.hourlyRate : await currentRate(data.type);

    const updated = await prisma.session.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        hourlyRate,
        instructorId: data.instructorId || null,
        vehicleId: data.vehicleId || null,
        notes: data.notes || null,
      },
    });

    revalidateSessionPages(data.clientId);
    if (previous.clientId !== data.clientId) revalidatePath(`/clients/${previous.clientId}`);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de la séance" };
  }
}

export async function deleteSession(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const session = await prisma.session.delete({ where: { id } });
    revalidateSessionPages(session.clientId);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la séance" };
  }
}
