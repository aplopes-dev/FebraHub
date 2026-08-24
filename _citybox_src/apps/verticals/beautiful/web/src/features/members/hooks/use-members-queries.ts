import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CATALOG_SERVICES_QUERY_KEY } from '@/features/catalog/hooks/use-catalog-queries';
import type { WeekSchedule } from '@/lib/work-schedule';
import * as memberService from '../services/member-service';
import type {
  CreateMemberFormData,
  UpdateMemberFormData,
} from '../types/member.types';

export const MEMBER_ROLES_QUERY_KEY = ['member-roles'] as const;
export const MEMBERS_QUERY_KEY = ['members'] as const;
export const MEMBER_DETAIL_QUERY_KEY = ['members', 'detail'] as const;
export const MEMBER_WORK_SCHEDULE_QUERY_KEY = [
  'members',
  'work-schedule',
] as const;

function invalidateMemberRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: MEMBER_DETAIL_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: MEMBER_WORK_SCHEDULE_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_QUERY_KEY });
}

export function useMemberRolesQuery() {
  return useQuery({
    queryKey: MEMBER_ROLES_QUERY_KEY,
    queryFn: () => memberService.listMemberRoles(),
  });
}

export function useMembersQuery(params?: memberService.ListMembersParams) {
  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEY, params],
    queryFn: () => memberService.listMembers(params),
  });
}

/**
 * Profissionais da agenda — `GET /v1/members?role=profissional`.
 * Filtra pelo papel exato na loja (não usa `schedulable`).
 */
export function useAgendaProfessionalsQuery(
  params?: Omit<memberService.ListMembersParams, 'role' | 'schedulable'>,
) {
  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEY, { ...params, role: 'profissional' }],
    queryFn: () =>
      memberService.listMembers({ ...params, role: 'profissional' }),
  });
}

/** @deprecated Use `useAgendaProfessionalsQuery` (`role=profissional`). */
export function useSchedulableMembersQuery(
  params?: Omit<memberService.ListMembersParams, 'role' | 'schedulable'>,
) {
  return useAgendaProfessionalsQuery(params);
}

export function useMemberByIdQuery(memberId: string | null) {
  return useQuery({
    queryKey: [...MEMBER_DETAIL_QUERY_KEY, memberId],
    queryFn: () => memberService.getMemberById(memberId!),
    enabled: Boolean(memberId),
  });
}

export function useCreateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberFormData) =>
      memberService.createMember(data),
    onSuccess: () => {
      invalidateMemberRelatedQueries(queryClient);
    },
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberFormData }) =>
      memberService.updateMember(id, data),
    onSuccess: () => {
      invalidateMemberRelatedQueries(queryClient);
    },
  });
}

export function useMemberWorkScheduleQuery(memberId: string | null) {
  return useQuery({
    queryKey: [...MEMBER_WORK_SCHEDULE_QUERY_KEY, memberId],
    queryFn: () => memberService.getMemberWorkSchedule(memberId!),
    enabled: Boolean(memberId),
  });
}

export function useReplaceMemberWorkScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      week,
    }: {
      memberId: string;
      week: WeekSchedule;
    }) => memberService.replaceMemberWorkSchedule(memberId, week),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...MEMBER_WORK_SCHEDULE_QUERY_KEY, variables.memberId],
      });
      queryClient.invalidateQueries({ queryKey: MEMBER_DETAIL_QUERY_KEY });
    },
  });
}

export function useResetMemberPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => memberService.resetMemberPassword(memberId),
    onSuccess: () => {
      invalidateMemberRelatedQueries(queryClient);
    },
  });
}
