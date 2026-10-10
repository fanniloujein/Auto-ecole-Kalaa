"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validation";
import type { ActionResult } from "@/actions/clients";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  return session;
}

function expenseData(data: ExpenseFormValues) {
  return {
    label: data.label,
    category: data.category,
    amount: data.amount,
    date: new Date(data.date),
    method: data.method,
    reference: data.reference || null,
    notes: data.notes || null,
  };
}

function revalidateExpensePages() {
  revalidatePath("/depenses");
  revalidatePath("/dashboard");
}

export async function createExpense(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  try {
    const expense = await prisma.expense.create({ data: expenseData(parsed.data) });
    revalidateExpensePages();
    return { success: true, data: expense };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de la dépense" };
  }
}

export async function updateExpense(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  try {
    const expense = await prisma.expense.update({ where: { id }, data: expenseData(parsed.data) });
    revalidateExpensePages();
    return { success: true, data: expense };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de la dépense" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.expense.delete({ where: { id } });
    revalidateExpensePages();
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la dépense" };
  }
}
