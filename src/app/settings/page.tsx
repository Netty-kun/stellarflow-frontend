import React from 'react';
import { AudioSettingsSection } from '@/app/components/client/AudioSettingsSection';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your platform preferences and notification settings</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <AudioSettingsSection />
      </div>
    </div>
  );
}
