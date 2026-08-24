import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/layout-primitives';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <PanelCard className="flex flex-col items-center gap-3 px-6 py-[60px] text-center">
      <Icon className="size-[50px] stroke-[1.5] text-black/30" />
      <h2 className="text-[19px] font-bold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Button className="mt-1.5 h-auto rounded-lg px-6 py-3 text-[15px] font-bold" onClick={onAction}>
        {actionLabel}
      </Button>
    </PanelCard>
  );
}

export function SummaryLine({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between py-[5px] text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export function SummaryTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2.5 flex justify-between border-t border-black/10 pt-3 text-[19px] font-extrabold">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
