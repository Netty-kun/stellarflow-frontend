"use client";

import React, { useState } from 'react';
import { SorobanBudgetVisualizer } from '@/components/contracts/SorobanBudgetVisualizer';
import type { SorobanResourceMetrics } from '@/types/sorobanBudget';

export default function ContractsPage() {
  const [metrics] = useState<SorobanResourceMetrics>({
    cpuInstructions: 45000000,
    memoryBytes: 15728640,
    readBytes: 102400,
    writeBytes: 51200,
  });

  return (
    <main className="min-h-screen bg-[#020817] text-white p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Soroban Smart Contracts</h1>
        <p className="text-slate-400">Manage and simulate contract executions with resource budget tracking.</p>
      </div>

      <div className="max-w-2xl">
        <SorobanBudgetVisualizer metrics={metrics} />
      </div>
    </main>
  );
}
