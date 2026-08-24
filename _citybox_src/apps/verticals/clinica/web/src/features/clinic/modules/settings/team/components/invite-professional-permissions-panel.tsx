'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Wallet,
} from 'lucide-react';
import {
  storePermissionsModulesForStrand,
  type Permission,
  type PermissionModule,
} from '@citybox/clinica-permissions';
import { useStore } from '@/lib/store-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
} from '@citybox/ui/atoms';

const MODULE_ICONS: Record<string, LucideIcon> = {
  settings: Settings,
  patients: ClipboardList,
  financial: Wallet,
  schedule: CalendarDays,
  dashboard: LayoutDashboard,
};

function comparePtLabel(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

function sortPermissionsByLabel(
  permissions: readonly Permission[],
): Permission[] {
  return [...permissions].sort((a, b) => comparePtLabel(a.label, b.label));
}

function sortModulesAlphabetically(
  modules: readonly PermissionModule[],
): PermissionModule[] {
  return [...modules]
    .map((module) => ({
      ...module,
      permissions: sortPermissionsByLabel(module.permissions),
    }))
    .sort((a, b) => comparePtLabel(a.name, b.name));
}

type InviteProfessionalPermissionsPanelProps = {
  permissionValues: Record<string, boolean>;
  disabled?: boolean;
  onToggle: (permissionId: string, granted: boolean) => void;
  onToggleModule: (module: PermissionModule, granted: boolean) => void;
};

function countSelected(module: PermissionModule, values: Record<string, boolean>): number {
  return module.permissions.filter((p) => values[p.id]).length;
}

export function InviteProfessionalPermissionsPanel({
  permissionValues,
  disabled = false,
  onToggle,
  onToggleModule,
}: InviteProfessionalPermissionsPanelProps) {
  const { clinicStrand } = useStore();
  const modules = useMemo(
    () => sortModulesAlphabetically(storePermissionsModulesForStrand(clinicStrand)),
    [clinicStrand],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        O cargo define o conjunto inicial. Você pode marcar ou desmarcar
        permissões individualmente antes de salvar.
      </p>

      <Accordion
        type="single"
        collapsible
        className="space-y-4"
      >
        {modules.map((module) => {
          const Icon = MODULE_ICONS[module.id] ?? Settings;
          const selectedCount = countSelected(module, permissionValues);
          const totalCount = module.permissions.length;
          const allSelected = selectedCount === totalCount && totalCount > 0;
          const someSelected = selectedCount > 0 && !allSelected;
          const toggleAllId = `invite-permission-module-${module.id}-all`;

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="rounded-xl border-0"
            >
              <AccordionTrigger className="rounded-xl bg-muted/50 px-4 py-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2 pr-2 text-sm font-medium text-foreground">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">
                    {module.name} ({selectedCount}/{totalCount})
                  </span>
                </span>
              </AccordionTrigger>

              <AccordionContent className="px-4 pt-3">
                <div className="space-y-3.5">
                  {module.permissions.map((permission) => {
                    const inputId = `invite-permission-${permission.id}`;

                    return (
                      <div key={permission.id} className="flex items-center gap-3">
                        <Checkbox
                          id={inputId}
                          checked={permissionValues[permission.id] === true}
                          disabled={disabled}
                          onCheckedChange={(checked) => {
                            onToggle(permission.id, checked === true);
                          }}
                        />
                        <Label htmlFor={inputId} className="text-sm font-normal">
                          {permission.label}
                        </Label>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-3.5">
                    <Label
                      htmlFor={toggleAllId}
                      className="text-sm font-normal text-muted-foreground"
                    >
                      {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </Label>
                    <Checkbox
                      id={toggleAllId}
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? 'indeterminate'
                            : false
                      }
                      disabled={disabled || totalCount === 0}
                      onCheckedChange={(checked) => {
                        onToggleModule(module, checked === true);
                      }}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
