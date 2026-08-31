"use client";

import { FxRateTicker, FxComparisonTable } from "/components/remittance";
import { PayoutStatusStepper } from "@/components/remittance/PayoutStatusStepper";
import { useRemittancePayoutsWithFallback } from "@/app/hooks/useRemittancePayouts";

export default function RemittancePage() {
  const { data: payouts } = useRemittancePayoutsWithFallback();
  const activePayout = payouts && payouts.length > 0 ? payouts[0] : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <div className="mb-8 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Remittance & FX Corridors
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Live fiat conversion rates and a fee comparison against traditional money transfer
          operators for StellarFlow&#39;s cross-border remittance corridors.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl-grid-cols-3">
        <div className="xl-col-span-1">
          <FxRateTicker />
        </div>
        <div className="xl-col-span-2">
          <FxComparisonTable />
        </div>
      </div>

      {activePayout && (
        <div className="mt-8">
          <PayoutStatusStepper transactionId={activePayout.id} />
        </div>
      )}
    </div>
  );
}