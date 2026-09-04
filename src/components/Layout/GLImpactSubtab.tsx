import React from "react";
import { CheckCircleOutline, WarningAmber } from "@mui/icons-material";

export interface GLEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  postingPeriod?: string;
  memo?: string;
}

interface GLImpactSubtabProps {
  entries: GLEntry[];
  documentNumber?: string;
}

export const GLImpactSubtab: React.FC<GLImpactSubtabProps> = ({ entries, documentNumber }) => {
  // Automatically combine multiple entries for the same account into a single unified row
  const combinedEntries = React.useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    const map = new Map<string, GLEntry>();

    for (const entry of entries) {
      const isDebit = Number(entry.debit || 0) > 0;
      const isCredit = Number(entry.credit || 0) > 0;
      const side = isDebit ? "DEBIT" : isCredit ? "CREDIT" : "ZERO";

      let code = String(entry.accountCode || "").trim();
      let name = String(entry.accountName || "").trim();
      const memoLower = String(entry.memo || "").toLowerCase();

      // Ensure GST/Tax lines never display as Equity or Bank
      if ((memoLower.includes("gst") || memoLower.includes("tax")) && (name.toLowerCase().includes("equity") || name.toLowerCase().includes("bank") || !name || name === "—")) {
        code = "1400";
        name = "Input GST";
      }

      // Ensure Item Fulfillment Debit displays as Vendor Return / Inventory Adjustment
      if (isDebit && (memoLower.includes("fulfillment") || memoLower.includes("return clearing") || memoLower.includes("vendor return")) && (name.toLowerCase().includes("bank") || name.toLowerCase().includes("cash") || !name || name === "—" || name.toLowerCase().includes("equity"))) {
        code = "5010";
        name = "Vendor Return / Inventory Adjustment";
      }

      // Ensure Item Fulfillment Credit displays as Inventory Asset
      if (isCredit && (memoLower.includes("fulfillment outward") || memoLower.includes("stock outward")) && (name.toLowerCase().includes("inventory") || !name || name === "—")) {
        code = "1200";
        name = "Inventory Asset";
      }
      
      // Clean normalized grouping key by account name or code + debit/credit side
      const identifier = name || code;
      const cleanKey = `${identifier.toLowerCase().replace(/[^a-z0-9]/g, "")}_${side}`;

      if (map.has(cleanKey)) {
        const existing = map.get(cleanKey)!;
        existing.debit = Number((Number(existing.debit || 0) + Number(entry.debit || 0)).toFixed(2));
        existing.credit = Number((Number(existing.credit || 0) + Number(entry.credit || 0)).toFixed(2));
        if (code && (!existing.accountCode || existing.accountCode === "—")) {
          existing.accountCode = code;
        }
        if (name && (!existing.accountName || existing.accountName === "—")) {
          existing.accountName = name;
        }
      } else {
        map.set(cleanKey, {
          accountCode: code || "—",
          accountName: name || "—",
          debit: Number(Number(entry.debit || 0).toFixed(2)),
          credit: Number(Number(entry.credit || 0).toFixed(2)),
          postingPeriod: entry.postingPeriod,
          memo: entry.memo || "GL Impact Entry",
        });
      }
    }

    return Array.from(map.values());
  }, [entries]);

  const totalDebits = combinedEntries.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCredits = combinedEntries.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-300 p-3 rounded-xs text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">GL Audit Ledger</span>
          {documentNumber && (
            <span className="font-mono text-slate-500">[{documentNumber}]</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isBalanced ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircleOutline className="!w-3.5 !h-3.5" />
              <span>BALANCED (Debits == Credits)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xs text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <WarningAmber className="!w-3.5 !h-3.5" />
              <span>UNBALANCED DIFFERENCE: ₹{Math.abs(totalDebits - totalCredits).toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Ledger Sublist Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#1d3e4c] text-white font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2.5 border-r border-slate-400 w-12 text-center">#</th>
              <th className="p-2.5 border-r border-slate-400 w-28 font-mono">ACCOUNT CODE</th>
              <th className="p-2.5 border-r border-slate-400 min-w-[200px]">ACCOUNT NAME</th>
              <th className="p-2.5 border-r border-slate-400 w-32 text-right">DEBIT AMOUNT (₹)</th>
              <th className="p-2.5 border-r border-slate-400 w-32 text-right">CREDIT AMOUNT (₹)</th>
              <th className="p-2.5 border-r border-slate-400 w-28 text-center">POSTING PERIOD</th>
              <th className="p-2.5 min-w-[160px]">MEMO / DETAILS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {combinedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                  No General Ledger posting entries recorded for this document.
                </td>
              </tr>
            ) : (
              combinedEntries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">{entry.accountCode || "—"}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{entry.accountName}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700 bg-emerald-50/30">
                    {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-sky-800 bg-sky-50/30">
                    {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">
                    {entry.postingPeriod || currentYearMonth}
                  </td>
                  <td className="p-2 text-slate-700 font-sans text-[11px]">{entry.memo || "System GL Impact Entry"}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono font-bold text-xs text-slate-900">
            <tr>
              <td colSpan={3} className="p-2.5 text-right uppercase tracking-wider border-r border-slate-300 text-slate-700">
                Total Posting Impact:
              </td>
              <td className="p-2.5 text-right border-r border-slate-300 text-emerald-800 font-extrabold text-sm">
                ₹{totalDebits.toFixed(2)}
              </td>
              <td className="p-2.5 text-right border-r border-slate-300 text-sky-800 font-extrabold text-sm">
                ₹{totalCredits.toFixed(2)}
              </td>
              <td colSpan={2} className="p-2.5 text-center text-slate-500 font-sans font-normal text-[11px]">
                {isBalanced ? "✓ Net posting balanced" : "⚠️ Attention required"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
