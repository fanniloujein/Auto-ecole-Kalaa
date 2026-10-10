import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClientDossier } from "@/lib/accounts";
import { PrintButton } from "@/components/print-button";
import { ClientFiche } from "@/components/client-fiche";

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [dossier, settings] = await Promise.all([
    getClientDossier({ id }),
    prisma.settings.findFirst(),
  ]);
  if (!dossier) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0">
      <PrintButton />
      <ClientFiche dossier={dossier} school={settings} />
    </div>
  );
}
