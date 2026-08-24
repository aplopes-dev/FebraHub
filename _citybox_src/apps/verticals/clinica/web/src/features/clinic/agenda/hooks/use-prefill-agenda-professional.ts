'use client';

import { useLayoutEffect, useMemo } from 'react';
import { useTeamMembers } from '@/features/clinic/agenda/api/team';
import { useCalendar } from '@/features/clinic/agenda/contexts/calendar-context';
import { useSchedulePermissions } from '@/features/clinic/agenda/hooks/use-schedule-permissions';
import { useSession } from '@/lib/session-context';

type ProfessionalOption = { value: string; label: string };

type PrefillAgendaProfessionalResult = {
  professionalOptions: ProfessionalOption[];
  /** Id a pré-selecionar (logado agendável ou filtro do calendário). */
  defaultProfessionalId: string | undefined;
  memberId: string | undefined;
  lockToSelf: boolean;
};

/** API mínima do RHF usada pelo pré-preenchimento (evita invariância de UseFormReturn). */
type ProfessionalFormApi = {
  getValues: (name: 'professionalId') => string;
  watch: (name: 'professionalId') => string;
  setValue: (
    name: 'professionalId',
    value: string,
    options?: {
      shouldValidate?: boolean;
      shouldDirty?: boolean;
      shouldTouch?: boolean;
    },
  ) => void;
};

/**
 * Opções do select de profissional + pré-preenche com o usuário logado quando ele
 * é agendável (lista da agenda **ou** `schedule_attend` / “Fazer atendimentos”).
 */
export function usePrefillAgendaProfessional(
  form: ProfessionalFormApi,
  options?: { lockToSelfWhenCannotCreateForOthers?: boolean },
): PrefillAgendaProfessionalResult {
  const lockWhenCannotCreate =
    options?.lockToSelfWhenCannotCreateForOthers ?? false;

  const { data: teamData } = useTeamMembers({ status: 'active' });
  const { session } = useSession();
  const { users, selectedUserId } = useCalendar();
  const { memberId, canAttend, canCreateForOthers } = useSchedulePermissions();

  /** Só trava em si mesmo se pode fazer atendimentos e não pode criar para outros. */
  const lockToSelf =
    lockWhenCannotCreate &&
    canAttend &&
    !canCreateForOthers &&
    Boolean(memberId);

  /** Logado pode ser o profissional da consulta (checkbox “Fazer atendimentos”). */
  const loggedUserIsSchedulable = Boolean(memberId && canAttend);

  const teamOptions = useMemo(
    () =>
      (teamData?.professionals ?? []).map((professional) => ({
        value: professional.id,
        label: professional.name,
      })),
    [teamData?.professionals],
  );

  const selfLabel =
    teamOptions.find((option) => option.value === memberId)?.label ||
    users.find((user) => user.id === memberId)?.name ||
    session?.user?.name?.trim() ||
    'Profissional atual';

  const professionalOptions = useMemo(() => {
    if (lockToSelf && memberId) {
      return [{ value: memberId, label: selfLabel }];
    }

    // Sessão diz que pode atender, mas a lista ainda não trouxe o membro (ex.: owner).
    if (
      loggedUserIsSchedulable &&
      memberId &&
      !teamOptions.some((option) => option.value === memberId)
    ) {
      return [{ value: memberId, label: selfLabel }, ...teamOptions];
    }

    return teamOptions;
  }, [
    lockToSelf,
    loggedUserIsSchedulable,
    memberId,
    selfLabel,
    teamOptions,
  ]);

  const defaultProfessionalId = useMemo(() => {
    if (professionalOptions.length === 0) return undefined;

    const ids = new Set(professionalOptions.map((option) => option.value));

    if (memberId && ids.has(memberId)) return memberId;

    if (selectedUserId !== 'all' && ids.has(selectedUserId)) {
      return selectedUserId;
    }

    return undefined;
  }, [memberId, professionalOptions, selectedUserId]);

  // Reage também quando professionalId é limpo (ex.: reset do form) — o Select
  // usa só field.value; sem re-prefill a UI e o "Buscar horário livre" ficam vazios.
  const watchedProfessionalId = form.watch('professionalId');

  useLayoutEffect(() => {
    if (!defaultProfessionalId) return;

    const current = (watchedProfessionalId ?? form.getValues('professionalId') ?? '').trim();

    if (lockToSelf) {
      if (current === defaultProfessionalId) return;
      form.setValue('professionalId', defaultProfessionalId, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: false,
      });
      return;
    }

    if (
      current.length > 0 &&
      professionalOptions.some((option) => option.value === current)
    ) {
      return;
    }

    form.setValue('professionalId', defaultProfessionalId, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: false,
    });
  }, [
    defaultProfessionalId,
    form,
    lockToSelf,
    professionalOptions,
    watchedProfessionalId,
  ]);

  return {
    professionalOptions,
    defaultProfessionalId,
    memberId,
    lockToSelf,
  };
}
