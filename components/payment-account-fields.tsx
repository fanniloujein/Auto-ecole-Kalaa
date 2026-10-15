"use client";

import { formatCurrency } from "@/lib/utils";
import {
  categoryNeedsDetail,
  paymentCategoryLabels,
  paymentCategoryOrder,
  paymentDetailLabels,
  paymentDetailOrder,
} from "@/lib/labels";
import type { AccountLine, ClientAccount } from "@/lib/billing";

export interface AccountSnapshot {
  lines: ClientAccount["lines"];
  details: ClientAccount["details"];
}

function restLabel(line?: AccountLine) {
  if (!line || line.balance === 0) return "";
  return line.balance > 0
    ? ` — reste ${formatCurrency(line.balance)}`
    : ` — avance ${formatCurrency(-line.balance)}`;
}

/** Choix par défaut : le premier compte (et la première précision) qui a un reste à payer */
export function defaultAccountChoice(account?: AccountSnapshot | null) {
  const category =
    (account && paymentCategoryOrder.find((c) => account.lines[c]?.balance > 0)) ?? "INSCRIPTION";
  return { category, detail: defaultDetail(category, account) };
}

export function defaultDetail(category: string, account?: AccountSnapshot | null) {
  if (!categoryNeedsDetail(category)) return "";
  const lines = account?.details[category as "INSCRIPTION" | "EXAMEN"];
  return (lines && paymentDetailOrder.find((d) => lines[d].balance > 0)) ?? "CODE";
}

/**
 * Listes déroulantes « Compte » et, pour une inscription ou un repassage d'examen,
 * « Code / Conduite / Park ».
 */
export function PaymentAccountFields({
  category,
  detail,
  onChange,
  account,
  inputClass,
  labelClass,
}: {
  category: string;
  detail: string;
  onChange: (category: string, detail: string) => void;
  account?: AccountSnapshot | null;
  inputClass: string;
  labelClass: string;
}) {
  const needsDetail = categoryNeedsDetail(category);
  const detailLines = needsDetail ? account?.details[category as "INSCRIPTION" | "EXAMEN"] : undefined;

  return (
    <>
      <div className={needsDetail ? "" : "col-span-2"}>
        <label className={labelClass}>Compte *</label>
        <select
          name="category"
          value={category}
          onChange={(e) => onChange(e.target.value, defaultDetail(e.target.value, account))}
          className={inputClass}
        >
          {paymentCategoryOrder.map((c) => (
            <option key={c} value={c}>
              {paymentCategoryLabels[c]}
              {restLabel(account?.lines[c])}
            </option>
          ))}
        </select>
      </div>
      {needsDetail && (
        <div>
          <label className={labelClass}>
            {category === "INSCRIPTION" ? "Inscription pour *" : "Repassage de l'examen *"}
          </label>
          <select
            name="detail"
            required
            value={detail}
            onChange={(e) => onChange(category, e.target.value)}
            className={inputClass}
          >
            {paymentDetailOrder.map((d) => (
              <option key={d} value={d}>
                {paymentDetailLabels[d]}
                {restLabel(detailLines?.[d])}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
