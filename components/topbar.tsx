"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { logoutAction } from "@/actions/auth-logout";

export function Topbar({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        <button
          className="md:hidden p-2 -ml-2 text-slate-600"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{adminName}</p>
            <p className="text-xs text-slate-500 leading-tight">Administrateur</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold text-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs font-medium text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
