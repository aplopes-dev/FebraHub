import {
  PERMISSION_KEYS,
  type TeamMemberPermissions,
} from '../entities/team-member.entity';

/** Descarta chaves desconhecidas e valores não booleanos vindos do HTTP/JSON. */
export function parseTeamMemberPermissions(
  raw: unknown,
): Partial<TeamMemberPermissions> {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;

  return Object.fromEntries(
    PERMISSION_KEYS.filter((key) => typeof source[key] === 'boolean').map(
      (key) => [key, source[key] as boolean],
    ),
  );
}
