import { Check, X, Clock, Minus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { examTypeLabels } from "@/lib/labels";
import type { ExamProgress } from "@/lib/billing";

const statusConfig = {
  REUSSI: { label: "Réussi", icon: Check, style: "bg-emerald-600 text-white" },
  PROGRAMME: { label: "Programmé", icon: Clock, style: "bg-blue-600 text-white" },
  ECHOUE: { label: "À repasser", icon: X, style: "bg-rose-600 text-white" },
  NON_PASSE: { label: "Non passé", icon: Minus, style: "bg-slate-200 text-slate-500" },
} as const;

/** Parcours d'examens du client : code → park → conduite */
export function ExamSteps({ progress }: { progress: ExamProgress[] }) {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {progress.map((p, i) => {
        const cfg = statusConfig[p.status];
        const Icon = cfg.icon;
        return (
          <li key={p.type} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <span
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                cfg.style
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {i + 1}. {examTypeLabels[p.type]}
              </p>
              <p className="text-xs text-slate-500">
                {cfg.label}
                {p.status === "REUSSI" && p.passedAt ? ` le ${formatDate(p.passedAt)}` : ""}
              </p>
              {p.attempts > 0 && (
                <p className="text-xs text-slate-400">
                  {p.attempts} passage{p.attempts > 1 ? "s" : ""}
                  {p.failures > 0 ? ` · ${p.failures} échec${p.failures > 1 ? "s" : ""}` : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
