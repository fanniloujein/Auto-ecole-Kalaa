import { cn, formatCurrency } from "@/lib/utils";
import { paymentCategoryLabels, paymentCategoryOrder } from "@/lib/labels";
import { formatHours, type ClientAccount } from "@/lib/billing";

function balanceLabel(balance: number) {
  if (balance > 0) return formatCurrency(balance);
  if (balance < 0) return `Avance ${formatCurrency(-balance)}`;
  return "Soldé";
}

/** Relevé de compte client : dû / payé / solde pour chaque compte */
export function AccountStatement({ account }: { account: ClientAccount }) {
  const details: Record<string, string> = {
    INSCRIPTION: "Frais d'inscription",
    CONDUITE: `${formatHours(account.hours.conduite + account.hours.park)} effectuées${
      account.hours.park > 0 ? ` (dont park ${formatHours(account.hours.park)})` : ""
    }`,
    CODE: `${formatHours(account.hours.code)} effectuées`,
    EXAMEN: "Frais d'examen et de repassage",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-xs uppercase border-b border-slate-200">
          <tr>
            <th className="text-left py-2 pr-3 font-medium">Compte</th>
            <th className="text-right py-2 px-3 font-medium">Montant dû</th>
            <th className="text-right py-2 px-3 font-medium">Payé</th>
            <th className="text-right py-2 pl-3 font-medium">Reste</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paymentCategoryOrder.map((c) => {
            const line = account.lines[c];
            return (
              <tr key={c}>
                <td className="py-2.5 pr-3">
                  <p className="font-medium text-slate-800">{paymentCategoryLabels[c]}</p>
                  <p className="text-xs text-slate-400">{details[c]}</p>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">
                  {formatCurrency(line.due)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">
                  {formatCurrency(line.paid)}
                </td>
                <td
                  className={cn(
                    "py-2.5 pl-3 text-right font-medium whitespace-nowrap",
                    line.balance > 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {balanceLabel(line.balance)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-slate-200">
          <tr>
            <td className="py-2.5 pr-3 font-semibold text-slate-900">Total</td>
            <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
              {formatCurrency(account.totalDue)}
            </td>
            <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
              {formatCurrency(account.totalPaid)}
            </td>
            <td
              className={cn(
                "py-2.5 pl-3 text-right font-bold whitespace-nowrap",
                account.balance > 0 ? "text-rose-600" : "text-emerald-600"
              )}
            >
              {balanceLabel(account.balance)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
