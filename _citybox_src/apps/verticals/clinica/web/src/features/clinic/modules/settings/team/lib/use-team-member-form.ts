'use client';

import { useCallback, useState } from 'react';
import type { FixedLunchBreakPatch } from '../types/service-hours';
import type { WeekdayId } from '../types/service-hours';
import type { WeekdaySchedulePatch } from '../types/service-hours';
import type { CommissionRule } from '../types/commission';
import type {
  TeamMemberSheetFormData,
  TeamMemberSheetFormPatch,
  TeamMemberSheetValidationErrors,
} from '../types/team-invite';
import type { PermissionModule } from '@citybox/clinica-permissions';
import type { TeamMember } from '@/features/shared/team';
import {
  createEmptyTeamMemberFormData,
  createTeamMemberFormDataFromMember,
} from './team-form-initial-values';
import { createPermissionMapForRole } from './team-member-permissions';
import { validateTeamMemberSheetForm } from './team-member-form-validation';

export function useTeamMemberForm() {
  const [values, setValues] = useState<TeamMemberSheetFormData>(
    createEmptyTeamMemberFormData,
  );
  const [errors, setErrors] = useState<TeamMemberSheetValidationErrors>({});

  const patch = useCallback((patchValues: TeamMemberSheetFormPatch) => {
    setValues((current) => {
      if (patchValues.role !== undefined && patchValues.role !== current.role) {
        return {
          ...current,
          ...patchValues,
          permissionValues:
            patchValues.permissionValues ??
            createPermissionMapForRole(patchValues.role),
        };
      }
      return { ...current, ...patchValues };
    });

    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<
        keyof TeamMemberSheetValidationErrors
      >) {
        if (key in next) {
          delete next[key];
        }
      }
      return next;
    });
  }, []);

  const togglePermission = useCallback(
    (permissionId: string, granted: boolean) => {
      setValues((current) => ({
        ...current,
        permissionValues: {
          ...current.permissionValues,
          [permissionId]: granted,
        },
      }));
    },
    [],
  );

  const togglePermissionModule = useCallback(
    (module: PermissionModule, granted: boolean) => {
      setValues((current) => {
        const next = { ...current.permissionValues };
        for (const permission of module.permissions) {
          next[permission.id] = granted;
        }
        return { ...current, permissionValues: next };
      });
    },
    [],
  );

  const updateWeekdaySchedule = useCallback(
    (weekdayId: WeekdayId, weekdayPatch: WeekdaySchedulePatch) => {
      setValues((current) => ({
        ...current,
        serviceHours: {
          ...current.serviceHours,
          weekSchedule: {
            ...current.serviceHours.weekSchedule,
            [weekdayId]: {
              ...current.serviceHours.weekSchedule[weekdayId],
              ...weekdayPatch,
            },
          },
        },
      }));
    },
    [],
  );

  const updateConsultationMinutes = useCallback((minutes: number) => {
    setValues((current) => ({
      ...current,
      serviceHours: {
        ...current.serviceHours,
        defaultConsultationMinutes: minutes,
      },
    }));
  }, []);

  const updateFixedLunchBreak = useCallback((lunchPatch: FixedLunchBreakPatch) => {
    setValues((current) => ({
      ...current,
      serviceHours: {
        ...current.serviceHours,
        fixedLunchBreak: {
          ...current.serviceHours.fixedLunchBreak,
          ...lunchPatch,
        },
      },
    }));
  }, []);

  const addCommissionRule = useCallback((rule: CommissionRule) => {
    setValues((current) => ({
      ...current,
      commissionRules: [...current.commissionRules, rule],
    }));
  }, []);

  const updateCommissionRule = useCallback(
    (ruleId: string, rulePatch: Partial<CommissionRule>) => {
      setValues((current) => ({
        ...current,
        commissionRules: current.commissionRules.map((rule) =>
          rule.id === ruleId ? { ...rule, ...rulePatch } : rule,
        ),
      }));
    },
    [],
  );

  const removeCommissionRule = useCallback((ruleId: string) => {
    setValues((current) => ({
      ...current,
      commissionRules: current.commissionRules.filter((rule) => rule.id !== ruleId),
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(createEmptyTeamMemberFormData());
    setErrors({});
  }, []);

  const initializeFromMember = useCallback((member: TeamMember) => {
    setValues(createTeamMemberFormDataFromMember(member));
    setErrors({});
  }, []);

  const validate = useCallback(() => {
    const validationErrors = validateTeamMemberSheetForm(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values]);

  return {
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
  };
}
