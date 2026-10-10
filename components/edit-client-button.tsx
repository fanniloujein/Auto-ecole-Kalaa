"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { ClientForm } from "@/components/client-form";
import type { ClientListItem } from "@/types";
import type { Tariffs } from "@/lib/billing";

export function EditClientButton({ client, tariffs }: { client: ClientListItem; tariffs: Tariffs }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50"
      >
        <Pencil className="h-4 w-4" />
        Modifier
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le client" size="lg">
        <ClientForm
          client={client}
          tariffs={tariffs}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
