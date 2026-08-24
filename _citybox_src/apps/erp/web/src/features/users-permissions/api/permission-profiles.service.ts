"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PermissionProfileListResponseDto,
  PermissionProfileResponseDto,
  SavePermissionProfilePayload,
} from "@/features/users-permissions/api/permission-profile.dto";
import { toPermissionProfile } from "@/features/users-permissions/api/permission-profile.mapper";
import type {
  PermissionProfile,
  PermissionProfileListParams,
  PermissionProfileListResult,
  PermissionProfileOption,
} from "@/features/users-permissions/types/permission-profile";

const MAX_PER_PAGE = 100;

function buildListQuery(params: {
  search: string;
  page: number;
  perPage: number;
  activeOnly: boolean;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("activeOnly", params.activeOnly ? "true" : "false");
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

/**
 * Listagem de perfis.
 *
 * Ativos: `activeOnly=true` + paginação server-side.
 * Excluídos: `activeOnly=false` devolve ativos+excluídos — filtramos
 * `deletedAt != null` e paginamos no client (cadastro curto).
 */
export async function listPermissionProfiles(
  params: PermissionProfileListParams,
): Promise<PermissionProfileListResult> {
  if (params.tab === "active") {
    const [activeRes, allRes] = await Promise.all([
      comercioFetch<PermissionProfileListResponseDto>(
        `/v1/permission-profiles?${buildListQuery({
          search: params.search,
          page: params.page,
          perPage: params.perPage,
          activeOnly: true,
        })}`,
      ),
      comercioFetch<PermissionProfileListResponseDto>(
        `/v1/permission-profiles?page=1&perPage=${MAX_PER_PAGE}&activeOnly=false`,
      ),
    ]);

    const deletedCount = allRes.data.filter((item) => item.deletedAt != null)
      .length;

    return {
      data: activeRes.data.map(toPermissionProfile),
      meta: activeRes.meta,
      tabCounts: {
        active: activeRes.meta.total,
        deleted: deletedCount,
      },
    };
  }

  const allRes = await comercioFetch<PermissionProfileListResponseDto>(
    `/v1/permission-profiles?${buildListQuery({
      search: params.search,
      page: 1,
      perPage: MAX_PER_PAGE,
      activeOnly: false,
    })}`,
  );

  const deleted = allRes.data
    .filter((item) => item.deletedAt != null)
    .map(toPermissionProfile);

  const total = deleted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const activeCount = allRes.data.filter((item) => item.deletedAt == null)
    .length;

  return {
    data: deleted.slice(start, start + params.perPage),
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts: { active: activeCount, deleted: total },
  };
}

export async function listActivePermissionProfileOptions(): Promise<
  PermissionProfileOption[]
> {
  const response = await comercioFetch<PermissionProfileListResponseDto>(
    `/v1/permission-profiles?page=1&perPage=${MAX_PER_PAGE}&activeOnly=true`,
  );
  return response.data.map((dto) => ({
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    isSystem: dto.isSystem,
    systemKey: dto.systemKey,
  }));
}

export async function getPermissionProfileById(
  id: string,
): Promise<PermissionProfile> {
  const response = await comercioFetch<PermissionProfileResponseDto>(
    `/v1/permission-profiles/${id}`,
  );
  return toPermissionProfile(response.data);
}

export async function createPermissionProfile(
  payload: SavePermissionProfilePayload,
): Promise<PermissionProfile> {
  const response = await comercioFetch<PermissionProfileResponseDto>(
    "/v1/permission-profiles",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toPermissionProfile(response.data);
}

export async function updatePermissionProfile(
  id: string,
  payload: SavePermissionProfilePayload,
): Promise<PermissionProfile> {
  const response = await comercioFetch<PermissionProfileResponseDto>(
    `/v1/permission-profiles/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toPermissionProfile(response.data);
}

export async function deletePermissionProfile(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/permission-profiles/${id}`, {
    method: "DELETE",
  });
}

export async function restorePermissionProfile(
  id: string,
): Promise<PermissionProfile> {
  const response = await comercioFetch<PermissionProfileResponseDto>(
    `/v1/permission-profiles/${id}/restore`,
    { method: "POST" },
  );
  return toPermissionProfile(response.data);
}
