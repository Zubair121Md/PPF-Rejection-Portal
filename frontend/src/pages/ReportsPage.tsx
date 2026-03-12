import { Card } from '../components/ui/Card';

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">
            Export CSV/Excel and view rejection analytics for B2B and B2C.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
            Export CSV
          </button>
          <button className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white">
            Export Excel
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <Card
          title="Daily rejection cost"
          subtitle="Trend of total rejection value over the last 30 days"
        >
          <div className="h-40 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            Line chart will appear here.
          </div>
        </Card>
        <Card
          title="B2B vs B2C comparison"
          subtitle="Channel-level rejection value split for this month"
        >
          <div className="h-40 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            Bar / pie chart will appear here.
          </div>
        </Card>
      </div>
    </div>
  );
}

