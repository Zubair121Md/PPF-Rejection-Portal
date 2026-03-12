import { Card } from '../components/ui/Card';

export default function AdminPanelPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Panel</h2>
        <p className="text-sm text-gray-500">
          Configure system settings and manage users (future).
        </p>
      </div>
      <Card
        title="System configuration"
        subtitle="High-level knobs that affect how rejection approvals behave"
        className="text-sm"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">High-value alert threshold</div>
              <div className="text-xs text-gray-500">
                Amount above which managers are notified immediately.
              </div>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-700 bg-gray-50">
              Coming soon
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">Notifications</div>
              <div className="text-xs text-gray-500">
                Email / WhatsApp channels for manager alerts.
              </div>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-700 bg-gray-50">
              Coming soon
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

