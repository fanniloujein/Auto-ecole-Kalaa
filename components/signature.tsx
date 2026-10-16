import { cn } from "@/lib/utils";

/** Signature discrète de la conceptrice de la plateforme */
export function Signature({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] tracking-wide", className)}>
      Conçu et développé par <span className="font-semibold">Loujein Fanni</span>
    </p>
  );
}
