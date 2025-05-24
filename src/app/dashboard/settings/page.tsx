import Settings from '@/components/settings/Settings';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-gray-500">Manage your website settings</p>
      </div>
      <Settings />
    </div>
  );
}
