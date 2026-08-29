const ROW_COUNT = 5;

const columns = [
  { label: "Date", width: "18%" },
  { label: "Type", width: "16%" },
  { label: "Asset", width: "14%" },
  { label: "Amount", width: "16%" },
  { label: "Status", width: "14%" },
  { label: "Transaction", width: "22%" },
] as const;

const skeletonWidths = ["w-28", "w-20", "w-16", "w-24", "w-16", "w-36"] as const;

export default function TransactionHistoryTableSkeleton() {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading transaction history"
    >
      <span className="sr-only">Loading transaction history</span>

      <div className="overflow-x-auto" aria-hidden="true">
        <table className="w-full min-w-[760px] table-fixed border-collapse">
          <colgroup>
            {columns.map((column) => (
              <col key={column.label} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
              <tr key={rowIndex} className="h-16">
                {columns.map((column, columnIndex) => (
                  <td key={column.label} className="px-4 py-4">
                    <div
                      className={`h-4 max-w-full rounded bg-slate-200 dark:bg-slate-700 ${skeletonWidths[columnIndex]} animate-pulse motion-reduce:animate-none`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
