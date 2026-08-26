"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Wallet,
  CalendarDays,
  Settings,
  Car,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/seances", label: "Séances", icon: CalendarClock },
  { href: "/paiements", label: "Paiements", icon: Wallet },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-blue-900 text-white w-64">
      <div className="flex items-center justify-between px-5 h-16 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="font-bold leading-tight">Auto-École</p>
            <p className="text-xs text-blue-300 leading-tight">Espace Admin</p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="md:hidden p-1 text-blue-200 hover:text-white"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800 hover:text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-blue-800 text-xs text-blue-300 flex items-center gap-2">
        <Car className="h-3.5 w-3.5" />
        Plateforme de gestion interne
      </div>
    </div>
  );
}
