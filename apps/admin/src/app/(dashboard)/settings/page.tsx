'use client';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage application settings.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">General Settings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure general application settings.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <input
                type="text"
                defaultValue="Palnadu.dev"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <input
                type="email"
                defaultValue="hello@palnadu.dev"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Email notification settings will be configured here.
          </p>
        </div>
      </div>
    </div>
  );
}
