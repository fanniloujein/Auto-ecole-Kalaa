import { prisma } from "@/lib/prisma";
import { ClientsTable } from "@/components/clients-table";

export default async function ClientsPage() {
  const [clients, packages] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { package: { select: { name: true } } },
    }),
    prisma.package.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez les candidats de votre auto-école</p>
      </div>

      <ClientsTable
        initialClients={clients.map((c: (typeof clients)[number]) => ({
          ...c,
          birthDate: c.birthDate?.toISOString() ?? null,
          startDate: c.startDate?.toISOString() ?? null,
          registrationDate: c.registrationDate.toISOString(),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          packageName: c.package?.name ?? null,
        }))}
        packages={packages}
      />
    </div>
  );
}
