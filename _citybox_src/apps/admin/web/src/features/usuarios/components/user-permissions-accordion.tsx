"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
  Label,
} from "@citybox/ui/atoms";
import type { AdminPermissionKey } from "../types";
import type { AdminUserFormData } from "../schemas/admin-user-schema";
import {
  PERMISSION_MODULES,
  selectAllPermissions,
} from "../lib/permissions-config";

interface UserPermissionsAccordionProps {
  control: Control<AdminUserFormData>;
  errors: FieldErrors<AdminUserFormData>;
}

export function UserPermissionsAccordion({
  control,
  errors,
}: UserPermissionsAccordionProps) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Controle de Permissões</h4>
          <p className="text-xs text-muted-foreground">
            Defina o que este usuário pode fazer no painel.
          </p>
        </div>
        <Controller
          name="permissions"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.onChange(selectAllPermissions())}
            >
              Selecionar Todos (Acesso Total)
            </Button>
          )}
        />
      </div>

      <Controller
        name="permissions"
        control={control}
        render={({ field }) => {
          const selected = field.value as AdminPermissionKey[];

          function togglePermission(key: AdminPermissionKey, checked: boolean) {
            if (checked) {
              field.onChange([...selected, key]);
              return;
            }
            field.onChange(selected.filter((permission) => permission !== key));
          }

          return (
            <Accordion type="multiple" className="w-full">
              {PERMISSION_MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {module.label}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {module.permissions.map((permission) => {
                          const checked = selected.includes(permission.key);
                          const checkboxId = `perm-${permission.key}`;

                          return (
                            <div
                              key={permission.key}
                              className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
                            >
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  togglePermission(
                                    permission.key,
                                    value === true,
                                  )
                                }
                              />
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor={checkboxId}
                                  className="text-sm font-medium leading-none"
                                >
                                  {permission.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          );
        }}
      />

      {errors.permissions ? (
        <p className="text-xs text-destructive">
          {errors.permissions.message}
        </p>
      ) : null}
    </div>
  );
}
