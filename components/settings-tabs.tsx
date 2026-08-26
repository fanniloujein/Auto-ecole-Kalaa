"use client";

import { useState } from "react";
import { PackagesPanel } from "@/components/packages-panel";
import { VehiclesPanel } from "@/components/vehicles-panel";
import { InstructorsPanel } from "@/components/instructors-panel";
import { GeneralSettingsPanel } from "@/components/general-settings-panel";
import { cn } from "@/lib/utils";

interface Props {
  packages: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    sessionsCount: number;
    isActive: boolean;
  }[];
  vehicles: {
    id: string;
    brand: string;
    model: string;
    plateNumber: string;
    licenseType: string;
    isActive: boolean;
  }[];
  instructors: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
  }[];
  settings: {
    schoolName: string;
    address: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    currency: string;
  } | null;
}

const tabs = [
  { id: "packages", label: "📦 Formules & prix" },
  { id: "vehicles", label: "🚗 Véhicules" },
  { id: "instructors", label: "👤 Moniteurs" },
  { id: "general", label: "⚙️ Informations générales" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SettingsTabs({ packages, vehicles, instructors, settings }: Props) {
  const [active, setActive] = useState<TabId>("packages");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              active === t.id
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "packages" && <PackagesPanel packages={packages} />}
      {active === "vehicles" && <VehiclesPanel vehicles={vehicles} />}
      {active === "instructors" && <InstructorsPanel instructors={instructors} />}
      {active === "general" && <GeneralSettingsPanel settings={settings} />}
    </div>
  );
}
