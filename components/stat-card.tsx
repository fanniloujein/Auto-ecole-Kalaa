import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "amber" | "emerald" | "rose" | "slate";
  hint?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center shrink-0", accentMap[accent])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
