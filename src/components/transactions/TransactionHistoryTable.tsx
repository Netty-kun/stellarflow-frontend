"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/icons/Icon";
import { ICON_IDS } from "@/components/icons/iconIds";
import { useToast } from "@/components/ui/ToastQueue";
import { exportTransactionsToCsv, type TaxPlatform } from "@/utils/csvExport";
import { useTransactionHistoryWithFallback } from "@/app/hooks/useTransactionHistory";
import TransactionHistoryTableSkeleton from "@/components/skeletons/TransactionHistoryTableSkeleton";
import type { TransactionRecord, TransactionType } from "@/types/transactions";

const TYPE_FILTERS: { label: string; value: "all" | TransactionType }[] = [
  { label: "All Activity", value: "all" },
  { label: "Swaps", value: "swap" },
  { label: "Liquidity", value: "liquidity" },
  { label: "Remittances", value: "remittance" },
];

const EXPORT_PLATFORMS: { label: string; value: TaxPlatform }[] = [
  { label: "Standard CSV", value: "standard" },
  { label: "Koinly", value: "koinly" },
  { label: "CoinTracker", value: "cointracker" },
];

const STATUS_STYLES: Record<TransactionRecord["status"], string> = {
  completed: "bg-emerald-400/10 text-emerald-400",
  pending: "bg-yellow-500/10 text-yellow-500",
  failed: "bg-red-500/10 text-red-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export default function TransactionHistoryTable() {
  const { data: transactions, isLoading } = useTransactionHistoryWithFallback();
  const { addToast, updateToast } = useToast();
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [exportPlatform, setExportPlatform] = useState<TaxPlatform>("standard");
  const [isExporting, setIsExporting] = useState(false);

  const filteredTransactions = useMemo(
    () =>
      typeFilter === "all"
        ? transactions
        : transactions.filter((tx) => tx.type === typeFilter),
    [transactions, typeFilter],
  );

  const handleExport = async () => {
    if (isExporting || filteredTransactions.length === 0) return;

    setIsExporting(true);
    const toastId = addToast({
      title: "Preparing CSV export",
      description: `Formatting ${filteredTransactions.length} transactions for ${EXPORT_PLATFORMS.find(p => p.value === exportPlatform)?.label}…`,
      status: "processing",
    });

    try {
      await exportTransactionsToCsv(filteredTransactions, { platform: exportPlatform });
      updateToast(toastId, {
        title: "Export ready",
        description: `${filteredTransactions.length} transactions downloaded as ${EXPORT_PLATFORMS.find(p => p.value === exportPlatform)?.label} CSV.`,
        status: "confirmed",
      });
    } catch {
      updateToast(toastId, {
        title: "Export failed",
        description: "Could not generate the CSV file. Please try again.",
        status: "failed",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <TransactionHistoryTableSkeleton />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#161b22] text-gray-100">
      <div className="flex flex-col gap-4 border-b border-gray-800 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Transaction History</h2>
          <p className="text-sm text-gray-500">
            Swaps, liquidity provision, and remittance settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "all" | TransactionType)
            }
            className="rounded-md border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            {TYPE_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            value={exportPlatform}
            onChange={(event) =>
              setExportPlatform(event.target.value as TaxPlatform)
            }
            className="rounded-md border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            {EXPORT_PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting || filteredTransactions.length === 0}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <Icon id={ICON_IDS.DOWNLOAD} className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#0d1117] text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">Type</th>
              <th scope="col" className="px-6 py-3 font-medium">Date</th>
              <th scope="col" className="px-6 py-3 font-medium">Amount Sent</th>
              <th scope="col" className="px-6 py-3 font-medium">Amount Received</th>
              <th scope="col" className="px-6 py-3 font-medium">Fee</th>
              <th scope="col" className="px-6 py-3 font-medium">Tx Hash</th>
              <th scope="col" className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 capitalize font-medium text-gray-200">
                  {tx.type}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {formatDate(tx.date)}
                </td>
                <td className="px-6 py-4">
                  {tx.sentAmount} {tx.sentCurrency}
                </td>
                <td className="px-6 py-4">
                  {tx.receivedAmount} {tx.receivedCurrency}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {tx.fee} {tx.feeCurrency}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  {truncateHash(tx.txHash)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[tx.status]}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
