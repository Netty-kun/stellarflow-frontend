import React from "react";

export default function TransactionHistoryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#161b22] text-gray-100" aria-busy="true" aria-label="Loading transaction history">
      <div className="flex flex-col gap-4 border-b border-gray-800 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-6 w-44 animate-pulse rounded bg-gray-700/50" />
          <div className="mt-1 h-4 w-72 animate-pulse rounded bg-gray-800/60" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 animate-pulse rounded-md bg-gray-800/80 border border-gray-700" />
          <div className="h-9 w-36 animate-pulse rounded-md bg-gray-800/80 border border-gray-700" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-gray-800/80 border border-gray-700" />
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
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-700/40" />
                    <div className="h-4 w-20 rounded bg-gray-700/40" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-24 rounded bg-gray-700/40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-20 rounded bg-gray-700/40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-20 rounded bg-gray-700/40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-14 rounded bg-gray-700/40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-28 rounded bg-gray-700/40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 rounded-full bg-gray-700/40" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
