"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyFicheLinkButton({ publicToken }: { publicToken: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/fiche/${publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papier indisponible (contexte non sécurisé) — pas bloquant
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="no-print inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-5 py-3.5 text-sm transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Lien copié !" : "Copier le lien de la fiche"}
    </button>
  );
}
