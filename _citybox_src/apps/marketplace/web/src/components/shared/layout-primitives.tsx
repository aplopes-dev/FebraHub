import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function PanelCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'rounded-[14px] border-0 bg-card py-0 shadow-[0_1px_6px_rgba(0,0,0,0.08)] ring-0',
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function PageContainer({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>) {
  return (
    <main className={cn('mx-auto w-full max-w-[1280px] flex-1', className)} {...props}>
      {children}
    </main>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-[18px] text-[clamp(22px,3vw,28px)] font-extrabold text-[rgba(0,0,0,0.9)]">
      {children}
    </h1>
  );
}

export function TwoColumnLayout({
  columns,
  className,
  children,
}: {
  columns: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('grid items-start gap-6', className)} style={{ gridTemplateColumns: columns }}>
      {children}
    </div>
  );
}

export function StickyAside({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn('sticky top-[120px]', className)}>{children}</aside>;
}
