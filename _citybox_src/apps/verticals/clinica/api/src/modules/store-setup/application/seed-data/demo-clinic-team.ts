import {
  getClinicStrandDefinition,
  resolveClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging/clinic-strand';
import {
  permissionsForRole,
  type ClinicRoleKey,
} from '@citybox/clinica-permissions';

export type DemoClinicTeamMember = {
  role: ClinicRoleKey;
  firstName: string;
  lastName: string;
  usernamePrefix: string;
};

/** E-mail sintético dos membros demo — usado para detectar seed de demonstração. */
export const DEMO_SEED_EMAIL_DOMAIN = 'seed.citybox.local';

/**
 * Equipe demo first-contact — **legado**. Catálogo mantido só para detectar
 * membros `{cargo}.{storeId8}@seed.citybox.local` já criados (UI pode remover).
 * Novas clínicas **não** seedam mais esses cargos — só o OWNER do cadastro.
 */
export const DEMO_CLINIC_TEAM: readonly DemoClinicTeamMember[] = [
  {
    role: 'dentista',
    firstName: 'Dentista',
    lastName: 'Demo',
    usernamePrefix: 'dentista',
  },
  {
    role: 'gerente',
    firstName: 'Gerente',
    lastName: 'Demo',
    usernamePrefix: 'gerente',
  },
  {
    role: 'secretario',
    firstName: 'Secretário',
    lastName: 'Demo',
    usernamePrefix: 'secretario',
  },
];

export function demoClinicTeamUsername(
  prefix: string,
  storeId: string,
): string {
  const suffix = storeId.replace(/-/g, '').slice(0, 8);
  return `${prefix}.${suffix}`.toLowerCase();
}

export function demoClinicTeamEmail(username: string): string {
  return `${username}@${DEMO_SEED_EMAIL_DOMAIN}`;
}

export function demoClinicTeamPermissions(role: ClinicRoleKey): string[] {
  return permissionsForRole(role);
}

/** Nome exibido do membro demo — profissional segue a vertente (Dentista vs Fisioterapeuta). */
export function resolveDemoClinicTeamMemberNames(
  demo: DemoClinicTeamMember,
  strand: ClinicStrand | string,
): { firstName: string; lastName: string } {
  if (demo.role === 'dentista') {
    const professional = getClinicStrandDefinition(
      resolveClinicStrand(strand),
    ).copy.roleLabels.professional;
    return { firstName: professional, lastName: demo.lastName };
  }
  return { firstName: demo.firstName, lastName: demo.lastName };
}

export function findDemoSeedMemberDefinition(
  username: string,
  storeId: string,
): DemoClinicTeamMember | null {
  const normalized = username.trim().toLowerCase();
  return (
    DEMO_CLINIC_TEAM.find(
      (demo) =>
        demoClinicTeamUsername(demo.usernamePrefix, storeId) === normalized,
    ) ?? null
  );
}

/** Remove sobrenome placeholder legado (`-`) usado quando só havia um nome. */
export function sanitizeMemberPersonName(
  firstName: string,
  lastName: string,
): { firstName: string; lastName: string } {
  const trimmedLast = lastName.trim();
  return {
    firstName: firstName.trim(),
    lastName: trimmedLast === '-' ? '' : trimmedLast,
  };
}

const DEMO_SEED_USERNAME_PATTERN =
  /^(dentista|gerente|secretario)\.[a-f0-9]{8}$/;

/**
 * Membros criados pelo seed first-contact legado — podem ser removidos pela UI.
 * Identificação pelo username `{cargo}.{storeId8}` (e-mail seed é secundário).
 * Novas clínicas não criam mais esses membros.
 */
export function isDemoSeedMember(input: {
  username: string;
  email?: string | null;
  storeId: string;
  lastName?: string | null;
}): boolean {
  const username = input.username.trim().toLowerCase();
  const lastName = input.lastName?.trim();

  const matchesStoreScopedUsername = Boolean(
    findDemoSeedMemberDefinition(username, input.storeId),
  );

  const matchesDemoPersona =
    lastName === 'Demo' && DEMO_SEED_USERNAME_PATTERN.test(username);

  if (!matchesStoreScopedUsername && !matchesDemoPersona) {
    return false;
  }

  const email = input.email?.trim().toLowerCase();
  if (email && !email.endsWith(`@${DEMO_SEED_EMAIL_DOMAIN}`)) {
    return false;
  }
  return true;
}

/** Nomes exibidos na API — corrige demo strand-aware e sobrenome placeholder. */
export function resolveMemberDisplayNames(
  member: {
    username: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  },
  storeId: string | undefined,
  clinicStrand: string | null | undefined,
): { firstName: string; lastName: string } {
  if (
    storeId &&
    isDemoSeedMember({
      username: member.username,
      email: member.email,
      storeId,
      lastName: member.lastName,
    })
  ) {
    const demo = findDemoSeedMemberDefinition(member.username, storeId);
    if (demo) {
      const names = resolveDemoClinicTeamMemberNames(
        demo,
        clinicStrand ?? resolveClinicStrand(undefined),
      );
      return sanitizeMemberPersonName(names.firstName, names.lastName);
    }
  }
  return sanitizeMemberPersonName(member.firstName, member.lastName);
}
