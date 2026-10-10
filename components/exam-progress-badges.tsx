import { cn } from "@/lib/utils";

const shortLabels: Record<string, string> = { CODE: "Code", PARK: "Park", CONDUITE: "Conduite" };

const statusStyles: Record<string, string> = {
  REUSSI: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PROGRAMME: "bg-blue-100 text-blue-700 border-blue-200",
  ECHOUE: "bg-rose-100 text-rose-700 border-rose-200",
  NON_PASSE: "bg-slate-50 text-slate-400 border-slate-200",
};

const statusTitles: Record<string, string> = {
  REUSSI: "réussi",
  PROGRAMME: "programmé",
  ECHOUE: "échoué",
  NON_PASSE: "non passé",
};

/** Pastilles d'avancement aux examens : code → park → conduite */
export function ExamProgressBadges({
  progress,
}: {
  progress: { type: string; status: string; failures: number }[];
}) {
  return (
    <div className="flex gap-1">
      {progress.map((p) => (
        <span
          key={p.type}
          title={`${shortLabels[p.type]} : ${statusTitles[p.status]}${
            p.failures > 0 ? ` (${p.failures} échec${p.failures > 1 ? "s" : ""})` : ""
          }`}
          className={cn(
            "text-[11px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap",
            statusStyles[p.status]
          )}
        >
          {shortLabels[p.type]}
          {p.status === "REUSSI" ? " ✓" : ""}
          {p.failures > 0 && p.status !== "REUSSI" ? ` ×${p.failures}` : ""}
        </span>
      ))}
    </div>
  );
}
