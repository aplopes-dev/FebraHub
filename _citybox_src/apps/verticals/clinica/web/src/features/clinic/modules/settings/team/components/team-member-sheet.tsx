'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@citybox/ui/atoms';
import { clinicRoleLabel } from '@citybox/clinica-permissions';
import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import type { TeamMember, TeamMemberFormValues, TeamRole } from '@/features/shared/team';
import { useStore } from '@/lib/store-context';
import { useTeamMemberForm } from '../lib/use-team-member-form';
import {
  suggestUsernameFromName,
} from '../lib/team-member-form-validation';
import { getServiceHours } from '../services/service-hours.service';
import { getCommissionRules } from '../services/commission-rules.service';
import { permissionIdsFromMap } from '../lib/team-member-permissions';
import { showsServiceHoursTabForApiRole } from '../lib/team-role-bridge';
import type { TeamMemberSubmitPayload } from '../types/team-invite';
import { InviteProfessionalPermissionsPanel } from './invite-professional-permissions-panel';
import { InviteProfessionalServiceHoursPanel } from './invite-professional-service-hours-panel';
import { ProfessionalCommissionPanel } from './professional-commission-panel';

type TeamMemberSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember?: TeamMember | null;
  /** Aba inicial ao abrir (ex.: deep-link de Financeiro → Comissão). */
  initialTab?: string;
  roles: TeamRole[];
  isRolesLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: TeamMemberSubmitPayload) => Promise<void>;
};

function toFormValues(
  values: ReturnType<typeof useTeamMemberForm>['values'],
): TeamMemberFormValues {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    username: values.username,
    email: values.email,
    role: values.role,
    permissions: permissionIdsFromMap(values.permissionValues),
  };
}

export function TeamMemberSheet({
  open,
  onOpenChange,
  editingMember = null,
  initialTab,
  roles,
  isRolesLoading,
  isSubmitting = false,
  onSubmit,
}: TeamMemberSheetProps) {
  const { storeId } = useStore();
  const isEditing = editingMember !== null;
  const usernameManuallyEdited = useRef(false);
  const [activeTab, setActiveTab] = useState('permissions');
  const [isLoadingServiceHours, setIsLoadingServiceHours] = useState(false);
  const [isLoadingCommissionRules, setIsLoadingCommissionRules] = useState(false);

  const {
    values,
    errors,
    patch,
    togglePermission,
    togglePermissionModule,
    updateWeekdaySchedule,
    updateConsultationMinutes,
    updateFixedLunchBreak,
    addCommissionRule,
    updateCommissionRule,
    removeCommissionRule,
    reset,
    initializeFromMember,
    validate,
  } = useTeamMemberForm();

  const showsServiceHours = showsServiceHoursTabForApiRole(values.role);
  const roleInCatalog = roles.some((role) => role.roleKey === values.role);
  const legacyRoleLabel =
    values.role && !roleInCatalog ? clinicRoleLabel(values.role) : null;

  useEffect(() => {
    if (!open) {
      reset();
      usernameManuallyEdited.current = false;
      setActiveTab('permissions');
      setIsLoadingServiceHours(false);
      setIsLoadingCommissionRules(false);
      return;
    }

    const allowedTabs = new Set(['permissions', 'service-hours', 'commission']);
    if (initialTab && allowedTabs.has(initialTab)) {
      setActiveTab(initialTab);
    } else {
      setActiveTab('permissions');
    }

    if (editingMember) {
      initializeFromMember(editingMember);
      usernameManuallyEdited.current = true;

      let cancelled = false;

      if (storeId) {
        setIsLoadingCommissionRules(true);
        void getCommissionRules(storeId, editingMember.id)
          .then((commissionRules) => {
            if (!cancelled) {
              patch({ commissionRules });
            }
          })
          .catch(() => {
            // Mantém [] quando a API ainda não tem regras.
          })
          .finally(() => {
            if (!cancelled) {
              setIsLoadingCommissionRules(false);
            }
          });
      }

      if (!storeId || !showsServiceHoursTabForApiRole(editingMember.role)) {
        return () => {
          cancelled = true;
        };
      }

      setIsLoadingServiceHours(true);

      void getServiceHours(storeId, editingMember.id)
        .then((serviceHours) => {
          if (!cancelled) {
            patch({ serviceHours });
          }
        })
        .catch(() => {
          // Mantém defaults do formulário quando a API ainda não tem registro.
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingServiceHours(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    reset();
    usernameManuallyEdited.current = false;
    setActiveTab('permissions');
  }, [open, editingMember, initialTab, initializeFromMember, patch, reset, storeId]);

  useEffect(() => {
    if (!open || isEditing || usernameManuallyEdited.current) return;
    const suggested = suggestUsernameFromName(values.firstName, values.lastName);
    patch({ username: suggested });
  }, [open, isEditing, values.firstName, values.lastName, patch]);

  useEffect(() => {
    if (!showsServiceHours && activeTab === 'service-hours') {
      setActiveTab('permissions');
    }
  }, [activeTab, showsServiceHours]);

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: TeamMemberSubmitPayload = {
      member: toFormValues(values),
      serviceHours: showsServiceHours ? values.serviceHours : undefined,
      commissionRules: values.commissionRules,
    };

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch {
      // O hook da página já exibe toast de erro.
    }
  };

  const isSheetBusy =
    isSubmitting || isLoadingServiceHours || isLoadingCommissionRules;

  const handleClose = () => {
    if (isSheetBusy) return;
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('flex flex-col gap-0 p-0', CLINIC_FLOATING_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle>{isEditing ? 'Editar membro' : 'Adicionar membro'}</SheetTitle>
        </SheetHeader>

        <div className="relative min-h-0 flex-1">
          {isSheetBusy ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {isLoadingServiceHours || isLoadingCommissionRules
                  ? 'Carregando…'
                  : 'Salvando…'}
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              'h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain',
              // Linux/Chromium: esconde botões ↑↓ da scrollbar vertical do sheet.
              '[scrollbar-width:thin] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:size-0',
            )}
          >
            <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="team-member-first-name">Primeiro nome</Label>
                  <Input
                    id="team-member-first-name"
                    value={values.firstName}
                    onChange={(event) => patch({ firstName: event.target.value })}
                    placeholder="Primeiro nome"
                    disabled={isSheetBusy}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.firstName}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="team-member-last-name">Sobrenome</Label>
                  <Input
                    id="team-member-last-name"
                    value={values.lastName}
                    onChange={(event) => patch({ lastName: event.target.value })}
                    placeholder="Sobrenome"
                    disabled={isSheetBusy}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.lastName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="team-member-email">E-mail</Label>
                  <Input
                    id="team-member-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => patch({ email: event.target.value })}
                    placeholder="email@clinica.com (opcional)"
                    disabled={isSheetBusy}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="team-member-username">Username</Label>
                  <Input
                    id="team-member-username"
                    placeholder="ex: bruno.arouca"
                    value={values.username}
                    disabled={isSheetBusy || isEditing}
                    className={isEditing ? 'bg-muted/50' : undefined}
                    onChange={(event) => {
                      usernameManuallyEdited.current = true;
                      patch({ username: event.target.value });
                    }}
                    aria-invalid={!!errors.username}
                  />
                  {errors.username ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.username}
                    </p>
                  ) : isEditing ? (
                    <p className="text-xs text-muted-foreground">
                      O username não pode ser alterado após o cadastro.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sugerido automaticamente a partir do nome.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="team-member-role">Cargo</Label>
                  <Select
                    value={values.role || undefined}
                    onValueChange={(role) => patch({ role })}
                    disabled={isSheetBusy || isEditing || isRolesLoading || roles.length === 0}
                  >
                    <SelectTrigger
                      id="team-member-role"
                      className={cn('w-full', isEditing && 'bg-muted/50')}
                      aria-invalid={!!errors.role}
                    >
                      <SelectValue
                        placeholder={
                          isRolesLoading ? 'Carregando...' : 'Selecionar cargo'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {legacyRoleLabel ? (
                        <SelectItem value={values.role}>
                          {legacyRoleLabel}
                        </SelectItem>
                      ) : null}
                      {roles.map((role) => (
                        <SelectItem key={role.roleKey} value={role.roleKey}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.role}
                    </p>
                  ) : isEditing ? (
                    <p className="text-xs text-muted-foreground">
                      {legacyRoleLabel
                        ? 'Cargo legado (não disponível para novos membros). Não pode ser alterado após o cadastro.'
                        : 'O cargo não pode ser alterado após o cadastro.'}
                    </p>
                  ) : null}
                </div>
              </div>

              {!isEditing ? (
                <p className="rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Uma senha provisória será gerada ao adicionar o membro. Ela é exibida
                  uma única vez — no primeiro acesso, o sistema solicita a definição de
                  uma nova senha.
                </p>
              ) : null}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-4">
                <div className="min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
                  <TabsList
                    variant="line"
                    className="h-auto w-max min-w-full flex-nowrap justify-start gap-4 rounded-none border-b border-border/60 bg-transparent p-0 sm:gap-6"
                  >
                    <TabsTrigger
                      value="permissions"
                      className="flex-none shrink-0 rounded-none px-0 pb-3 whitespace-nowrap"
                    >
                      Permissões
                    </TabsTrigger>
                    {showsServiceHours ? (
                      <TabsTrigger
                        value="service-hours"
                        className="flex-none shrink-0 rounded-none px-0 pb-3 whitespace-nowrap"
                      >
                        Horários de Atendimento
                      </TabsTrigger>
                    ) : null}
                    <TabsTrigger
                      value="commission"
                      className="flex-none shrink-0 rounded-none px-0 pb-3 whitespace-nowrap"
                    >
                      Comissão
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="permissions" className="mt-0">
                  <InviteProfessionalPermissionsPanel
                    permissionValues={values.permissionValues}
                    disabled={isSheetBusy}
                    onToggle={togglePermission}
                    onToggleModule={togglePermissionModule}
                  />
                </TabsContent>

                {showsServiceHours ? (
                  <TabsContent value="service-hours" className="mt-0">
                    <InviteProfessionalServiceHoursPanel
                      serviceHours={values.serviceHours}
                      disabled={isSheetBusy}
                      onUpdateWeekday={updateWeekdaySchedule}
                      onUpdateConsultationMinutes={updateConsultationMinutes}
                      onUpdateFixedLunchBreak={updateFixedLunchBreak}
                    />
                  </TabsContent>
                ) : null}

                <TabsContent value="commission" className="mt-0">
                  <ProfessionalCommissionPanel
                    commissionRules={values.commissionRules}
                    disabled={isSheetBusy}
                    onAdd={addCommissionRule}
                    onUpdate={updateCommissionRule}
                    onRemove={removeCommissionRule}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleClose}
            disabled={isSheetBusy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => void handleSubmit()}
            disabled={isSheetBusy}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : isEditing ? (
              'Salvar alterações'
            ) : (
              'Adicionar membro'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
