"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { examSchema, type ExamFormValues } from "@/lib/validation";
import { examTypeLabels } from "@/lib/labels";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

function revalidateExamPages(clientId: string) {
  revalidatePath("/examens");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/paiements");
  revalidatePath(`/clients/${clientId}`);
}

/** Un examen déjà réussi ne peut pas être repassé ; un échec permet un nouveau passage */
async function checkNotAlreadyPassed(data: ExamFormValues, excludeId?: string) {
  const passed = await prisma.exam.findFirst({
    where: {
      clientId: data.clientId,
      type: data.type,
      result: "REUSSI",
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return passed
    ? `Le client a déjà réussi : ${examTypeLabels[data.type].toLowerCase()}`
    : null;
}

function examData(data: ExamFormValues) {
  return {
    clientId: data.clientId,
    type: data.type,
    date: new Date(data.date),
    time: data.time || null,
    result: data.result,
    fee: data.fee,
    location: data.location || null,
    notes: data.notes || null,
  };
}

export async function createExam(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const error = await checkNotAlreadyPassed(data);
    if (error) return { success: false, error };

    const exam = await prisma.exam.create({ data: examData(data) });
    revalidateExamPages(data.clientId);
    return { success: true, data: exam };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de l'examen" };
  }
}

export async function updateExam(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const previous = await prisma.exam.findUnique({ where: { id } });
    if (!previous) return { success: false, error: "Examen introuvable" };

    if (data.result === "REUSSI") {
      const error = await checkNotAlreadyPassed(data, id);
      if (error) return { success: false, error };
    }

    const exam = await prisma.exam.update({ where: { id }, data: examData(data) });
    revalidateExamPages(data.clientId);
    if (previous.clientId !== data.clientId) revalidatePath(`/clients/${previous.clientId}`);
    return { success: true, data: exam };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de l'examen" };
  }
}

export async function deleteExam(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const exam = await prisma.exam.delete({ where: { id } });
    revalidateExamPages(exam.clientId);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de l'examen" };
  }
}
