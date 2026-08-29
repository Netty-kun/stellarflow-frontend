"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/server/Header";
import { Sidebar } from "../components/server/Sidebar";
import { NetworkSelector } from "../../components/navigation/NetworkSelector";
import {
  useNetwork,
  useNetworkActions,
  useNetworkStatus,
} from "../components/providers/NetworkProvider";
import Icon from "@/components/icons/Icon";
import { ICON_IDS } from "@/components/icons/iconIds";

export default function SettingsPage() {
  const { customHorizonUrl, horizonUrl, network } = useNetwork();
  const { setCustomHorizonEndpoint, resetToDefaultEndpoint } = useNetworkActions();
  const { isValidating, error } = useNetworkStatus();

  const [inputUrl, setInputUrl] = useState(customHorizonUrl);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect({
    setInputUrl(customHorizonUrl);
  }, [customHorizonUrl]);

  const handleSaveCustomRpc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const success = await setCustomHorizonEndpoint(inputUrl);
    if (success && inputUrl.trim()) {
      setSuccessMessage("Custom Horizon RPC endpoint validated and saved successfully!");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f1e] text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-6">Advanced Settings</h1>
          
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Network Target</h2>
            <p className="text-sm text-gray-400 mb-4">
              Select the active Stellar network environment for operations.
            </p>
            <NetworkSelector />
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Custom Horizon RPC Endpoint</h2>
            <p className="text-sm text-gray-400 mb-4">
              Advanced users can override the official Stellar Horizon node with a custom RPC URL. Connectivity is validated on change; if ping fails, the app automatically falls back to the public network default.
            </p>

            <form onSubmit={handleSaveCustomRpc} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Custom Horizon URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://horizon-custom.example.com"
                    className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    {isValidating && (
                      <span className="h-3 w-3 rounded-full border border-white border-t-transparent animate-spin" />
                    )}
                    Validate & Save
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg" role="alert">
                  <Icon id={ICON_IDS.alertTriangle} size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  <Icon id={ICON_IDS.checkCircle || ICON_IDS.alertTriangle} size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Active Horizon Endpoint: <strong className="text-gray-200 font-mono">{horizonUrl}</strong></span>
                {customHorizonUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      resetToDefaultEndpoint();
                      setInputUrl("");
                    }}
                    className="text-red-400 hover:underline"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
