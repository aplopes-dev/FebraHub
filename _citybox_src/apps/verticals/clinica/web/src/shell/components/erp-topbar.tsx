'use client';

import type { ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Separator,
} from '@citybox/ui/atoms';
import { StoreSwitcher } from '@/shell/components/store-switcher';
import { ClinicCommandSearch } from '@/shell/components/clinic-command-search';
import {
  TOPBAR_VERTICAL_SEPARATOR_CLASS,
  TopbarUserIdentity,
} from '@/shell/components/topbar-user-identity';
import { useVerticalNavHit } from '@/lib/vertical/nav-hooks';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import { useSession } from '@/lib/session-context';

function TopbarActions({ compact = false }: { compact?: boolean }) {
  const { session, logout } = useSession();

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      <StoreSwitcher
        compact
        className="hidden w-[min(100%,13rem)] sm:flex"
      />
      <Separator
        orientation="vertical"
        className={`hidden sm:block ${TOPBAR_VERTICAL_SEPARATOR_CLASS}`}
      />
      <div className="flex items-center gap-1.5 sm:gap-4">
        {!compact ? <TopbarUserIdentity user={session?.user} /> : null}
        <Button
          type="button"
          variant="outline"
          size={compact ? 'xs' : 'sm'}
          aria-label="Sair"
          onClick={() => void logout()}
          className={compact ? 'h-8 shrink-0 px-2.5' : undefined}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}

export function VerticalTopbar({ verticalId }: { verticalId: string }) {
  const { manifest } = useVerticalManifest();
  const hit = useVerticalNavHit(verticalId);
  const brandLabel = manifest?.brand.shortName ?? verticalId;
  const moduleLabel = hit?.module.label;
  const pageLabel = hit?.leaf.label;

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-3">
      <Breadcrumb className="min-w-0 justify-self-start overflow-hidden">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate text-sm font-medium sm:text-base">
              {brandLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
          {moduleLabel ? (
            <>
              <BreadcrumbSeparator className="hidden sm:inline" />
              <BreadcrumbItem className="hidden min-w-0 sm:block">
                <BreadcrumbPage className="truncate">{moduleLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
          {pageLabel && pageLabel !== moduleLabel ? (
            <>
              <BreadcrumbSeparator className="hidden md:inline" />
              <BreadcrumbItem className="hidden min-w-0 md:block">
                <BreadcrumbPage className="truncate">{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <ClinicCommandSearch className="w-[5.5rem] justify-self-center sm:w-[min(100vw-12rem,28rem)]" />

      <div className="flex justify-self-end">
        <div className="sm:hidden">
          <TopbarActions compact />
        </div>
        <div className="hidden sm:block">
          <TopbarActions />
        </div>
      </div>
    </div>
  );
}

export function ErpTopbar({ breadcrumb }: { breadcrumb?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0 flex-1 overflow-hidden">
        {breadcrumb ?? (
          <span className="block truncate text-sm font-medium text-foreground">
            Citybox ERP
          </span>
        )}
      </div>
      <TopbarActions />
    </div>
  );
}
