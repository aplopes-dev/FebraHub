import { Panel } from '@/components/ui/panel';
import type { TransactionActivity } from '../types';

export function TransactionActivityTimeline({
  activities,
}: {
  activities: readonly TransactionActivity[];
}) {
  if (activities.length === 0) {
    return (
      <Panel className="px-6 py-8 text-sm text-muted-foreground">
        Sem histórico de alterações.
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-foreground">Histórico</h2>
      <ul className="flex flex-col gap-3">
        {activities.map((entry) => (
          <li
            key={entry.id}
            className="rounded-3xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-foreground">{entry.actorName}</span>
              <span className="text-xs text-muted-foreground">{entry.at}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{entry.message}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
