import { prisma } from "@/lib/prisma";
import { PaymentsOverview } from "@/components/payments-overview";

export default async function PaiementsPage() {
  const [payments, clients] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { date: "desc" },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.client.findMany({
      select: { id: true, firstName: true, lastName: true, totalPrice: true, paidAmount: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
        <p className="text-slate-500 text-sm mt-1">Historique de tous les paiements enregistrés</p>
      </div>

      <PaymentsOverview
        payments={payments.map((p: (typeof payments)[number]) => ({
          id: p.id,
          clientId: p.clientId,
          clientName: `${p.client.firstName} ${p.client.lastName}`,
          amount: p.amount,
          date: p.date.toISOString(),
          method: p.method,
          reference: p.reference,
        }))}
        clients={clients}
      />
    </div>
  );
}
