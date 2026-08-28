"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CreateMemberPayload,
  CreateMemberResponseDto,
  MemberListResponseDto,
  MemberResponseDto,
  ResetMemberPasswordResponseDto,
  SetMemberPdvPinPayload,
  UpdateMemberPayload,
} from "@/features/users-permissions/api/member.dto";
import { toPlatformUser } from "@/features/users-permissions/api/member.mapper";
import type {
  CreateMemberResult,
  MemberListParams,
  MemberListResult,
  PlatformUser,
  ResetPasswordResult,
} from "@/features/users-permissions/types/user";

const MAX_PER_PAGE = 100;

function buildListQuery(params: {
  search: string;
  page: number;
  perPage: number;
  active?: boolean;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  // `active=true` → só ativos. Omitir/`false` → a API devolve todos
  // (`activeOnly` só filtra quando truthy — ver ListMembersUseCase).
  if (params.active === true) query.set("active", "true");
  return query.toString();
}

/**
 * Listagem de membros.
 *
 * Aba **ativos**: `active=true` + paginação server-side.
 * Aba **excluídos** (soft-deactivate via `active:false`): a API não filtra
 * “só inativos”, então buscamos o conjunto amplo e filtramos/paginamos no
 * client (equipes costumam ser pequenas; teto `MAX_PER_PAGE`).
 */
export async function listMembers(
  params: MemberListParams,
): Promise<MemberListResult> {
  if (params.tab === "active") {
    const [activeRes, allRes] = await Promise.all([
      apiFetch<MemberListResponseDto>(
        `/v1/members?${buildListQuery({
          search: params.search,
          page: params.page,
          perPage: params.perPage,
          active: true,
        })}`,
      ),
      // Contagem da aba Excluídos (sem search — paridade com tabCounts de carriers).
      apiFetch<MemberListResponseDto>(
        `/v1/members?page=1&perPage=${MAX_PER_PAGE}`,
      ),
    ]);

    const deletedCount = allRes.data.filter((item) => !item.active).length;

    // Filtros client-side — a API mock não expõe todos os query params.
    let data = activeRes.data.map(toPlatformUser);
    if (params.functionalRole !== "all") {
      data = data.filter((user) => user.functionalRole === params.functionalRole);
    }

    return {
      data,
      meta: {
        total: activeRes.meta.total,
        page: activeRes.meta.page,
        perPage: activeRes.meta.perPage,
        totalPages: activeRes.meta.totalPages,
      },
      tabCounts: {
        active: activeRes.meta.total,
        deleted: deletedCount,
      },
    };
  }

  // Aba excluídos: baixa o conjunto e filtra inactive.
  const allRes = await apiFetch<MemberListResponseDto>(
    `/v1/members?${buildListQuery({
      search: params.search,
      page: 1,
      perPage: MAX_PER_PAGE,
    })}`,
  );

  let inactive = allRes.data
    .filter((item) => !item.active)
    .map(toPlatformUser);

  if (params.functionalRole !== "all") {
    inactive = inactive.filter(
      (user) => user.functionalRole === params.functionalRole,
    );
  }

  const total = inactive.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const activeCount = allRes.data.filter((item) => item.active).length;

  return {
    data: inactive.slice(start, start + params.perPage),
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts: { active: activeCount, deleted: total },
  };
}

/** Carrega um membro pelo membershipId (não há GET :id — busca na listagem). */
export async function getMemberById(id: string): Promise<PlatformUser> {
  const response = await apiFetch<MemberListResponseDto>(
    `/v1/members?page=1&perPage=${MAX_PER_PAGE}`,
  );
  const found = response.data.find((item) => item.id === id);
  if (!found) {
    throw new Error("Membro não encontrado");
  }
  return toPlatformUser(found);
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<CreateMemberResult> {
  const response = await apiFetch<CreateMemberResponseDto>("/v1/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    member: toPlatformUser(response.data),
    provisionalPassword: response.meta.provisionalPassword,
    linkedExistingAccount: response.meta.linkedExistingAccount,
  };
}

export async function updateMember(
  id: string,
  payload: UpdateMemberPayload,
): Promise<PlatformUser> {
  const response = await apiFetch<MemberResponseDto>(`/v1/members/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return toPlatformUser(response.data);
}

/** Soft-deactivate — preferido em vez de DELETE hard. */
export async function deactivateMember(id: string): Promise<PlatformUser> {
  return updateMember(id, { active: false });
}

export async function reactivateMember(id: string): Promise<PlatformUser> {
  return updateMember(id, { active: true });
}

export async function resetMemberPassword(
  id: string,
): Promise<ResetPasswordResult> {
  const response = await apiFetch<ResetMemberPasswordResponseDto>(
    `/v1/members/${id}/reset-password`,
    { method: "POST" },
  );
  return {
    email: response.data.email,
    provisionalPassword: response.data.provisionalPassword,
  };
}

/**
 * Define/redefine o PIN de caixa. A API exige `pdvCode` já gravado no membro
 * e destrava bloqueio por tentativas erradas.
 */
export async function setMemberPdvPin(
  id: string,
  payload: SetMemberPdvPinPayload,
): Promise<PlatformUser> {
  const body: SetMemberPdvPinPayload = { pin: payload.pin };
  if (payload.pdvCode !== undefined) {
    body.pdvCode = payload.pdvCode;
  }
  const response = await apiFetch<MemberResponseDto>(
    `/v1/members/${id}/pdv-pin`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
  return toPlatformUser(response.data);
}
