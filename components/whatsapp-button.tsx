"use client";

import { buildWhatsappUrl, type WhatsappClientData } from "@/lib/whatsapp";

export function WhatsappButton({
  client,
  publicToken,
}: {
  client: Omit<WhatsappClientData, "ficheUrl">;
  publicToken: string;
}) {
  function handleClick() {
    const ficheUrl =
      typeof window !== "undefined" ? `${window.location.origin}/fiche/${publicToken}` : undefined;
    const url = buildWhatsappUrl({ ...client, ficheUrl });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="no-print w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 text-base shadow-sm transition-colors"
    >
      📱 Envoyer la fiche sur WhatsApp
    </button>
  );
}
