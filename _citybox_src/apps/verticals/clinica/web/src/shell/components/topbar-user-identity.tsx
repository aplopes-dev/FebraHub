'use client';

import type { Session } from '@/lib/auth';

/** Altura alinhada ao SelectTrigger do seletor de loja no header. */
export const TOPBAR_VERTICAL_SEPARATOR_CLASS = 'h-9';

export function TopbarUserIdentity({ user }: { user?: Session['user'] | null }) {
  const username = user?.username ?? user?.email;

  return (
    <div className="hidden w-max max-w-[12rem] shrink-0 flex-col sm:flex">
      <span className="truncate text-sm font-medium leading-tight text-foreground">
        {user?.name ?? '—'}
      </span>
      {username ? (
        <span className="truncate text-xs leading-tight text-muted-foreground">{username}</span>
      ) : null}
    </div>
  );
}
