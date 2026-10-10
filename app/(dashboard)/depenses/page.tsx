import { prisma } from "@/lib/prisma";
import { ExpensesManager } from "@/components/expenses-manager";

export default async function DepensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dépenses</h1>
        <p className="text-slate-500 text-sm mt-1">
          Sorties d&apos;argent de l&apos;auto-école : carburant, entretien, salaires, loyer, factures...
        </p>
      </div>

      <ExpensesManager
        expenses={expenses.map((e: (typeof expenses)[number]) => ({
          id: e.id,
          label: e.label,
          category: e.category,
          amount: e.amount,
          date: e.date.toISOString(),
          method: e.method,
          reference: e.reference,
          notes: e.notes,
        }))}
      />
    </div>
  );
}
