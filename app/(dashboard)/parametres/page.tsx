import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "@/components/settings-tabs";

export default async function ParametresPage() {
  const [packages, vehicles, instructors, settings] = await Promise.all([
    prisma.package.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.instructor.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.settings.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">
          Formules, véhicules, moniteurs et informations générales
        </p>
      </div>

      <SettingsTabs
        packages={packages}
        vehicles={vehicles}
        instructors={instructors}
        settings={
          settings
            ? {
                schoolName: settings.schoolName,
                address: settings.address,
                phone: settings.phone,
                whatsapp: settings.whatsapp,
                email: settings.email,
                currency: settings.currency,
              }
            : null
        }
      />
    </div>
  );
}
