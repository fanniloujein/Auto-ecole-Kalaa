"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { paymentSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

export async function createPayment(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const payment = await prisma.payment.create({
      data: {
        clientId: data.clientId,
        amount: data.amount,
        date: new Date(data.date),
        category: data.category,
        method: data.method,
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/paiements");
    revalidatePath("/dashboard");
    revalidatePath("/clients");
    revalidatePath(`/clients/${data.clientId}`);
    return { success: true, data: payment };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du paiement" };
  }
}

export async function deletePayment(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return { success: false, error: "Paiement introuvable" };

    await prisma.payment.delete({ where: { id } });

    revalidatePath("/paiements");
    revalidatePath("/dashboard");
    revalidatePath("/clients");
    revalidatePath(`/clients/${payment.clientId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression du paiement" };
  }
}
