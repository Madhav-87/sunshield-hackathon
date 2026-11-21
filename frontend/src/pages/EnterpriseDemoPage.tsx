import { BarChart3, UsersRound } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export function EnterpriseDemoPage({ planner = false }: { planner?: boolean }) {
  return (
    <main className="min-h-screen bg-sunshield-cloud px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Badge tone="demo">Demonstration data · Employer view</Badge>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {planner ? 'Worksite protection planner' : 'Workforce heat safety overview'}
        </h1>
        <section className="mt-7 grid gap-4 md:grid-cols-2">
          <Card>
            <UsersRound aria-hidden="true" className="text-teal-800" size={24} />
            <h2 className="mt-4 font-display text-xl font-semibold">Worksite summary</h2>
            <p className="mt-3 leading-7 text-slate-600">
              This employer view uses demonstration data. It does not show worker tracking or
              personal worker information.
            </p>
          </Card>
          <Card>
            <BarChart3 aria-hidden="true" className="text-slate-700" size={24} />
            <h2 className="mt-4 font-display text-xl font-semibold">Exposure overview</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The shared technical requirements document does not yet define this endpoint’s request
              and response schemas.
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
