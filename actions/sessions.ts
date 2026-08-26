"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sessionSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
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
        instructorId: data.instructorId || null,
        vehicleId: data.vehicleId || null,
        notes: data.notes || null,
      },
    });

    if (data.status === "EFFECTUEE") {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { doneSessions: { increment: 1 } },
      });
    }

    revalidatePath("/seances");
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${data.clientId}`);
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

    const updated = await prisma.session.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        instructorId: data.instructorId || null,
        vehicleId: data.vehicleId || null,
        notes: data.notes || null,
      },
    });

    // Ajuste le compteur de séances effectuées si le statut a changé
    if (previous && previous.status !== "EFFECTUEE" && data.status === "EFFECTUEE") {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { doneSessions: { increment: 1 } },
      });
    } else if (previous && previous.status === "EFFECTUEE" && data.status !== "EFFECTUEE") {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { doneSessions: { decrement: 1 } },
      });
    }

    revalidatePath("/seances");
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${data.clientId}`);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de la séance" };
  }
}

export async function deleteSession(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.session.delete({ where: { id } });
    revalidatePath("/seances");
    revalidatePath("/planning");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la séance" };
  }
}
