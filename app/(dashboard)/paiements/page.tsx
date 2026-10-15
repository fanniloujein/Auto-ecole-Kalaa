import { prisma } from "@/lib/prisma";
import { PaymentsOverview } from "@/components/payments-overview";
import { getClientsWithAccounts } from "@/lib/accounts";
import { paymentCategoryOrder } from "@/lib/labels";

export default async function PaiementsPage() {
  const [payments, rows] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { date: "desc" },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    }),
    getClientsWithAccounts(),
  ]);

  // Encaissé et reste à percevoir par compte
  const summary = paymentCategoryOrder.map((category) => ({
    category,
    collected: rows.reduce((sum, r) => sum + r.account.lines[category].paid, 0),
    outstanding: rows.reduce((sum, r) => sum + Math.max(0, r.account.lines[category].balance), 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
        <p className="text-slate-500 text-sm mt-1">
          Encaissements des clients, séparés par compte : inscription, code, conduite, park et repassage d&apos;examen
        </p>
      </div>

      <PaymentsOverview
        payments={payments.map((p: (typeof payments)[number]) => ({
          id: p.id,
          clientId: p.clientId,
          clientName: `${p.client.firstName} ${p.client.lastName}`,
          amount: p.amount,
          date: p.date.toISOString(),
          category: p.category,
          detail: p.detail,
          method: p.method,
          reference: p.reference,
        }))}
        clients={rows
          .map(({ client, account }) => ({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            account: { lines: account.lines, details: account.details },
          }))
          .sort((a, b) => a.firstName.localeCompare(b.firstName))}
        summary={summary}
      />
    </div>
  );
}
