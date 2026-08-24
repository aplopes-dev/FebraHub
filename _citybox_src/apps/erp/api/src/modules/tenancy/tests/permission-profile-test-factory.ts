import { PermissionProfile } from '../domain/entities/permission-profile.entity';
import { InMemoryPermissionProfileRepository } from './in-memory-permission-profile.repository';
import { ORGANIZATION_ID } from './tenancy-test-factory';

export const PERMISSION_PROFILE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const SYSTEM_PERMISSION_PROFILE_ID =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/** Id válido do catálogo — usado nos testes de criação/edição. */
export const SAMPLE_PERMISSION_IDS = ['vendas.vendas.view'] as const;

type ProfileOverrides = Partial<{
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  systemKey: string | null;
  permissionIds: string[];
  deletedAt: Date | null;
}>;

export function makePermissionProfile(
  overrides: ProfileOverrides = {},
): PermissionProfile {
  return PermissionProfile.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Operador customizado',
      description: overrides.description ?? 'Perfil de teste',
      isSystem: overrides.isSystem ?? false,
      systemKey: overrides.systemKey ?? null,
      permissionIds: overrides.permissionIds ?? [...SAMPLE_PERMISSION_IDS],
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? PERMISSION_PROFILE_ID,
  );
}

export function makeSystemPermissionProfile(
  overrides: ProfileOverrides = {},
): PermissionProfile {
  return makePermissionProfile({
    id: SYSTEM_PERMISSION_PROFILE_ID,
    name: 'Administrador',
    description: 'Perfil de sistema',
    isSystem: true,
    systemKey: 'administrador',
    permissionIds: [...SAMPLE_PERMISSION_IDS],
    ...overrides,
  });
}

export function makePermissionProfileRepositories() {
  return {
    permissionProfileRepository: new InMemoryPermissionProfileRepository(),
  };
}
