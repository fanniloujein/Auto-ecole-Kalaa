"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintButton({ hideBack = false }: { hideBack?: boolean }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto mb-4 flex items-center justify-end no-print">
      {!hideBack && (
        <button
          onClick={() => router.back()}
          className="mr-auto inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2.5"
      >
        <Printer className="h-4 w-4" />
        Télécharger / Imprimer en PDF
      </button>
    </div>
  );
}
