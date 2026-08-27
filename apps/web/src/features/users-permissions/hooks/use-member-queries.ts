"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import {
  getMemberById,
  listMembers,
} from "@/features/users-permissions/api/members.service";
import { memberKeys } from "@/features/users-permissions/hooks/query-keys";
import type { MemberListParams } from "@/features/users-permissions/types/user";

export function useMembersQuery(params: MemberListParams) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: memberKeys.list(organizationId, params),
    queryFn: () => listMembers(params),
    enabled: hydrated && Boolean(organizationId),
  });
}

export function useMemberQuery(id: string) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: memberKeys.detail(organizationId, id),
    queryFn: () => getMemberById(id),
    enabled: hydrated && Boolean(organizationId) && Boolean(id),
    retry: false,
  });
}
