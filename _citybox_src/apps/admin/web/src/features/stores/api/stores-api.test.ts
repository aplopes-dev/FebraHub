import { describe, it, expect } from "vitest";
import { mapVerticalOwner } from "./stores-api";
import type { VerticalMemberDto } from "@/lib/admin-api";

function buildDto(overrides: Partial<VerticalMemberDto> = {}): VerticalMemberDto {
  return {
    id: "owner-1",
    username: "nascimento",
    firstName: "Ana",
    lastName: "Nascimento",
    email: "ana@clinica.test",
    status: "active",
    organizationRole: "OWNER",
    organizationRoleLabel: "Responsável",
    isOrganizationOwner: true,
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    clinics: [],
    ...overrides,
  };
}

describe("mapVerticalOwner", () => {
  // Sem papel nem permissões: são clínicos, mudam por unidade e o admin não os edita —
  // exibi-los prometeria um controle que a tela do responsável não tem.
  it("keeps only the identity and the access situation the operator acts on", () => {
    const owner = mapVerticalOwner(buildDto());

    expect(owner).toEqual({
      id: "owner-1",
      username: "nascimento",
      firstName: "Ana",
      lastName: "Nascimento",
      email: "ana@clinica.test",
      hasPassword: true,
      provisionalExpiresAt: null,
      isDisabled: false,
    });
  });

  // `hasPassword: false` + `provisionalExpiresAt: null` é como o responsável **nasce** no
  // provisionamento — é essa combinação que faz a tela oferecer "Gerar senha".
  it("reports a responsible provisioned without any credential", () => {
    const owner = mapVerticalOwner(
      buildDto({ hasPassword: false, provisionalExpiresAt: null }),
    );

    expect(owner.hasPassword).toBe(false);
    expect(owner.provisionalExpiresAt).toBeNull();
  });

  // `provisionalExpiresAt` precisa atravessar o mapeamento: `hasPassword` continua
  // `false` depois que o admin gera a provisória, então é ele que distingue
  // "nunca teve credencial" de "já recebeu uma".
  it("carries the provisional deadline so the screen can tell a generated password apart", () => {
    const owner = mapVerticalOwner(
      buildDto({
        hasPassword: false,
        provisionalExpiresAt: "2026-08-06T14:58:58.596Z",
      }),
    );

    expect(owner.provisionalExpiresAt).toBe("2026-08-06T14:58:58.596Z");
  });

  it("reports a disabled responsible as inactive and normalizes the missing e-mail", () => {
    const owner = mapVerticalOwner(buildDto({ status: "disabled", email: null }));

    expect(owner.isDisabled).toBe(true);
    expect(owner.email).toBeUndefined();
  });
});
