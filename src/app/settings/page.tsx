"use client";

import React, { useState, useEffect } from 'react';
import Icon from '@/components/icons/Icon';
import { ICON_IDS } from '@/components/icons/iconIds';
import { useDebounce } from '../hooks/useDebounce';
import { useRafThrottle } from '../hooks/useRafThrottle';
import { openPushPreferencesModal } from '@/components/notifications';
import { loadPreferences } from '@/services/notifications';
import { useTransactionAudio } from '@/hooks/useTransactionAudio';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useScreenLock, ScreenLockModal } from '@/components/security/ScreenLockModal';
import { useTransactionHistoryWithFallback } from '@/app/hooks/useTransactionHistory';
import { exportTransactionsToCsv, type TaxPlatform } from '@/utils/csvExport';
import { useToast } from '@/components/ui/ToastQueue';
import { useDashboardCustomizer } from '@/components/dashboard/useDashboardCustomizer';
import { WalletNonceResync } from '@/components/wallet/WalletNonceResync';
import { useZKProofLoader } from '@/components/zk/useZKProofLoader';

interface Settings {
  emailReports: boolean;
  pushNotifications: boolean;
  publicStatusPage: boolean;
  multiSigApproval: boolean;
  sessionTimeout: string;
}

const TOGGLE_STYLES = {
  enabled: {
    track: 'bg-blue-600',
    knob: 'right-1',
  },
  disabled: {
    track: 'bg-gray-700',
    knob: 'left-1',
  },
};

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [screenLockModalOpen, setScreenLockModalOpen] = useState(false);
  const {
    isEnabled: soundEffectsEnabled,
    toggle: toggleSoundEffects,
    currentPack,
    setSoundPack,
    playPreview,
  } = useTransactionAudio();
  const {
    isEnabled: hapticsEnabled,
    toggle: toggleHaptics,
    triggerTap: testHapticTap,
    triggerTxConfirm: testHapticTx,
    isSupported: hapticsSupported,
  } = useHapticFeedback();
  const { isPinSet, isLocked, idleTimeoutMinutes, lockNow } = useScreenLock();
  const { data: transactions } = useTransactionHistoryWithFallback();
  const { addToast, updateToast } = useToast();
  const [exportPlatform, setExportPlatform] = useState<TaxPlatform>("standard");
  const [isExporting, setIsExporting] = useState(false);
  const { openCustomizer, Customizer } = useDashboardCustomizer();
  const { Loader: ZKProofLoader, startProofGeneration } = useZKProofLoader();
  const [settings, setSettings] = useState<Settings>({
    emailReports: true,
    pushNotifications: false,
    publicStatusPage: false,
    multiSigApproval: false,
    sessionTimeout: '15 Minutes',
  });
  const [savedSettings, setSavedSettings] = useState<Settings>({ ...settings });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const prefs = loadPreferences();
    setTimeout(() => {
      setSettings((prev) => ({ ...prev, pushNotifications: prefs.enabled }));
      setSavedSettings((prev) => ({ ...prev, pushNotifications: prefs.enabled }));
    }, 0);
  }, []);

  const debouncedSettings = useDebounce(settings, 500);

  const throttledSetSessionTimeout = useRafThrottle((v: string) => setSettings(prev => ({ ...prev, sessionTimeout: v })));

  // Compute hasChanges at render time to be used in the render and effect
  const hasChanges = JSON.stringify(debouncedSettings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (hasChanges && !isPending) {
      const timer = setTimeout(async () => {
        setIsPending(true);
        console.log('Saving settings:', debouncedSettings);
        await new Promise(r => setTimeout(r, 300));
        setSavedSettings({ ...debouncedSettings });
        setIsPending(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [debouncedSettings, hasChanges, isPending]);

  const handleToggle = (key: keyof Settings) => {
    if (key === 'pushNotifications') {
      openPushPreferencesModal();
      return;
    }
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const multiSigTrackClasses = settings.multiSigApproval ? TOGGLE_STYLES.enabled.track : TOGGLE_STYLES.disabled.track;
  const multiSigKnobClasses = settings.multiSigApproval ? TOGGLE_STYLES.enabled.knob : TOGGLE_STYLES.disabled.knob;

  const EXPORT_PLATFORMS: { label: string; value: TaxPlatform }[] = [
    { label: "Standard CSV", value: "standard" },
    { label: "Koinly", value: "koinly" },
    { label: "CoinTracker", value: "cointracker" },
  ];

  const handleExport = async () => {
    if (isExporting || !transactions || transactions.length === 0) return;

    setIsExporting(true);
    const platformLabel = EXPORT_PLATFORMS.find(p => p.value === exportPlatform)?.label;
    const toastId = addToast({
      title: "Preparing CSV export",
      description: `Formatting ${transactions.length} transactions for ${platformLabel}…`,
      status: "processing",
    });

    try {
      await exportTransactionsToCsv(transactions, { platform: exportPlatform });
      updateToast(toastId, {
        title: "Export ready",
        description: `${transactions.length} transactions downloaded as ${platformLabel} CSV.`,
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Admin / Configuration</p>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      </div>

      <div className="max-w-4xl space-y-8">
        
        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.user} size={20} className="text-blue-400" />
            Admin Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-bold">Display Name</label>
              <input type="text" defaultValue="Sadeeq" className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-bold">Admin Role</label>
              <input type="text" defaultValue="Lead Trainer / Developer" disabled className="w-full bg-[#0d1117] border border-gray-800 rounded-md py-2 px-3 text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon id={ICON_IDS.key} size={20} className="text-yellow-400" />
              Infrastructure Keys
            </h2>
            <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Icon id={ICON_IDS.rotateCcw} size={12} /> Rotate Keys
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-bold">Backend Secret Key</label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"} 
                  defaultValue="sk_live_51P2z..." 
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm font-mono focus:outline-none" 
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showKey ? <Icon id={ICON_IDS.eyeOff} size={16} /> : <Icon id={ICON_IDS.eye} size={16} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.bell} size={20} className="text-purple-400" />
            Alert Channels
          </h2>
          <div className="space-y-4">
            <ToggleItem 
              icon={<Icon id={ICON_IDS.mailIcon} size={18} />} 
              title="Email Reports" 
              description="Receive weekly institutional summaries and uptime reports."
              enabled={settings.emailReports}
              onToggle={() => handleToggle('emailReports')}
            />
            <ToggleItem 
              icon={<Icon id={ICON_IDS.smartphone} size={18} />} 
              title="Push Notifications" 
              description="Opt in to browser alerts for swaps, limit orders, remittances, and governance votes."
              enabled={settings.pushNotifications}
              onToggle={() => handleToggle('pushNotifications')}
            />
            <ToggleItem
              icon={<Icon id={ICON_IDS.globe} size={18} />}
              title="Public Status Page"
              description="Automatically update the status.stellarflow.io page."
              enabled={settings.publicStatusPage}
              onToggle={() => handleToggle('publicStatusPage')}
            />
            <ToggleItem
              icon={<Icon id={ICON_IDS.volume2} size={18} />}
              title="Sound Effects"
              description="Play a chime when a transaction confirms or fails. Off by default."
              enabled={soundEffectsEnabled}
              onToggle={toggleSoundEffects}
            />
            {soundEffectsEnabled && (
              <div className="pl-12 pr-3 py-3 border-t border-gray-800 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-300">Sound Pack Theme</p>
                  <p className="text-xs text-gray-500">Choose a synthesizer voice for transaction notifications.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'minimalist', label: 'Minimalist' },
                      { id: 'retro', label: 'Retro 8-Bit' },
                      { id: 'futuristic', label: 'Futuristic Synth' },
                      { id: 'muted', label: 'Muted' },
                    ] as const
                  ).map((pack) => (
                    <div
                      key={pack.id}
                      onClick={() => setSoundPack(pack.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        currentPack === pack.id
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-800 bg-[#0d1117]/50 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="soundPack"
                          checked={currentPack === pack.id}
                          onChange={() => setSoundPack(pack.id)}
                          className="text-blue-500 focus:ring-blue-500 bg-transparent border-gray-700 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-200">{pack.label}</span>
                      </div>
                      {pack.id !== 'muted' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPreview(pack.id);
                          }}
                          className="flex items-center justify-center p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                          title={`Preview ${pack.label}`}
                        >
                          <Icon id={ICON_IDS.volume2} size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ToggleItem
              icon={<Icon id={ICON_IDS.smartphone} size={18} />}
              title="Haptic Feedback"
              description="Deliver tactile vibration cues on button taps, slider adjustments, and transaction confirmations on mobile devices."
              enabled={hapticsEnabled}
              onToggle={toggleHaptics}
            />
            {hapticsEnabled && (
              <div className="pl-12 pr-3 py-3 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-300">Tactile Vibration Preview</p>
                  <p className="text-xs text-gray-500">
                    {hapticsSupported
                      ? 'Vibration API active on this mobile device.'
                      : 'Web Vibration API active (cues activate on supported mobile devices).'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => testHapticTap(true)}
                    className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors font-medium"
                  >
                    Tap Pulse (12ms)
                  </button>
                  <button
                    type="button"
                    onClick={() => testHapticTx(true)}
                    className="px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30 transition-colors font-medium"
                  >
                    Double Pulse
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.lock} size={20} className="text-blue-400" />
            Master Passcode Lock
          </h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {isPinSet ? `Enabled · auto-locks after ${idleTimeoutMinutes}m idle` : 'Disabled'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Opt-in local screen lock. Blurs the dashboard and requires a PIN after a period
                of inactivity. The PIN is kept only in memory for this tab — never persisted or
                sent over the network.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setScreenLockModalOpen(true)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {isPinSet ? 'Manage' : 'Set Up'}
              </button>
              {isPinSet && (
                <button
                  type="button"
                  onClick={lockNow}
                  disabled={isLocked}
                  className="text-xs text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
                >
                  Lock now
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.shield} size={20} className="text-green-400" />
            Governance Security
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Multi-Sig Approval</p>
                <p className="text-xs text-gray-500">Require two admins to sign off on WASM upgrades.</p>
              </div>
              <button
                onClick={() => handleToggle('multiSigApproval')}
                className={`w-12 h-6 rounded-full relative cursor-pointer ${multiSigTrackClasses}`}
                style={{ transition: 'transform 150ms ease' }}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full ${multiSigKnobClasses}`} style={{ transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Session Timeout</p>
                <p className="text-xs text-gray-500">Automatically logout after inactivity.</p>
              </div>
              <select 
                className="bg-[#0d1117] border border-gray-700 rounded py-1 px-2 text-xs"
                value={settings.sessionTimeout}
                onChange={(e) => throttledSetSessionTimeout(e.target.value)}
              >
                <option>15 Minutes</option>
                <option>1 Hour</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.download} size={20} className="text-orange-400" />
            Tax Export
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Export your transaction history in formats compatible with popular crypto tax platforms.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-bold">Export Format</label>
              <select
                value={exportPlatform}
                onChange={(e) => setExportPlatform(e.target.value as TaxPlatform)}
                className="w-full md:w-64 bg-[#0d1117] border border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
              >
                {EXPORT_PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || !transactions || transactions.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#161b22] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon id={ICON_IDS.download} size={16} />
              {isExporting ? "Exporting…" : "Download Tax Report"}
            </button>
            <p className="text-xs text-gray-500">
              {transactions?.length || 0} transactions available for export
            </p>
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon id={ICON_IDS.layoutDashboard} size={20} className="text-cyan-400" />
              Dashboard Layout
            </h2>
            <button
              onClick={openCustomizer}
              className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Icon id={ICON_IDS.layoutDashboard} size={16} />
              Customize Layout
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Drag and drop to reorder widgets, toggle visibility, or reset to default layout.
          </p>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon id={ICON_IDS.refreshCcw} size={20} className="text-blue-400" />
            Wallet Nonce Resync
          </h2>
          <WalletNonceResync />
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon id={ICON_IDS.shield} size={20} className="text-purple-400" />
              ZK Proof Generator (Demo)
            </h2>
            <button
              onClick={() => startProofGeneration()}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Icon id={ICON_IDS.play} size={16} />
              Generate Proof
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Multi-stage visual loader for client-side Groth16 zero-knowledge proof generation.
            Stages: Compiling Witness → Computing Proof → Verifying Local Proof → Submitting Payload.
          </p>
          <ZKProofLoader />
        </section>

        <div className="flex justify-end gap-4 pt-4">
          <button className="px-6 py-2 border border-gray-700 rounded-lg text-sm relative overflow-hidden" style={{ transition: 'border-color 150ms ease' }}>
            <span className="absolute inset-0 bg-gray-800 opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
            <span className="relative z-10">Cancel</span>
          </button>
          <button 
            disabled={!hasChanges || isPending}
            className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-bold flex items-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ transition: 'transform 150ms ease, box-shadow 150ms ease' }}
          >
            <span className="absolute inset-0 bg-blue-700 opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
            <span className="relative z-10 flex items-center gap-2">
              <Icon id={ICON_IDS.save} size={18} />
              {isPending ? 'Saving...' : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {screenLockModalOpen && (
        <ScreenLockModal isOpen={screenLockModalOpen} onClose={() => setScreenLockModalOpen(false)} />
      )}
      <Customizer />
    </div>
  );
}

function ToggleItem({ icon, title, description, enabled, onToggle }: { icon: React.ReactNode, title: string, description: string, enabled: boolean, onToggle: () => void }) {
  const trackClasses = enabled ? TOGGLE_STYLES.enabled.track : TOGGLE_STYLES.disabled.track;
  const knobClasses = enabled ? TOGGLE_STYLES.enabled.knob : TOGGLE_STYLES.disabled.knob;

  return (
    <div className="flex items-start justify-between p-3 rounded-lg relative overflow-hidden" style={{ transition: 'border-color 150ms ease' }}>
      <span className="absolute inset-0 bg-[#1c2128] opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
      <div className="flex gap-4 relative z-10">
        <div className="mt-1 text-gray-500">{icon}</div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="relative z-10">
        <button
          onClick={onToggle}
          className={`w-10 h-5 rounded-full relative cursor-pointer ${trackClasses}`}
          style={{ transition: 'transform 150ms ease' }}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full ${knobClasses}`} style={{ transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </button>
      </div>
    </div>
  );
}