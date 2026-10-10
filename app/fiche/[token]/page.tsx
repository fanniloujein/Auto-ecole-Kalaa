import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getClientDossier } from "@/lib/accounts";
import { PrintButton } from "@/components/print-button";
import { ClientFiche } from "@/components/client-fiche";

// Route publique : aucune authentification requise.
// Le token est un identifiant unique non devinable (cuid), différent de l'id interne du client.
export default async function PublicFichePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [dossier, settings] = await Promise.all([
    getClientDossier({ publicToken: token }),
    prisma.settings.findFirst(),
  ]);
  if (!dossier) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0">
      <PrintButton hideBack />
      <ClientFiche dossier={dossier} school={settings} />
    </div>
  );
}
