import { prisma } from "@/lib/prisma";
import { ClientsTable } from "@/components/clients-table";
import { getClientsWithAccounts } from "@/lib/accounts";
import { tariffsFrom } from "@/lib/billing";

export default async function ClientsPage() {
  const [rows, settings] = await Promise.all([
    getClientsWithAccounts(),
    prisma.settings.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500 text-sm mt-1">
          Candidats, inscriptions, avancement aux examens et situation financière
        </p>
      </div>

      <ClientsTable
        initialClients={rows.map(({ client: c, account, examProgress }) => ({
          ...c,
          birthDate: c.birthDate?.toISOString() ?? null,
          startDate: c.startDate?.toISOString() ?? null,
          registrationDate: c.registrationDate.toISOString(),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          totalDue: account.totalDue,
          totalPaid: account.totalPaid,
          balance: account.balance,
          examProgress,
        }))}
        tariffs={tariffsFrom(settings)}
      />
    </div>
  );
}
