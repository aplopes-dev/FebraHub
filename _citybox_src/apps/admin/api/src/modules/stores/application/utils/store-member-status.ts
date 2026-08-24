export type StoreMemberLifecycleStatus =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'expired';

const PROVISIONAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function provisionalExpiresAtFromNow(now = new Date()): Date {
  return new Date(now.getTime() + PROVISIONAL_TTL_MS);
}

export function deriveStoreMemberStatus(input: {
  hasPassword: boolean;
  disabledAt: Date | null;
  provisionalExpiresAt: Date | null;
  now?: Date;
}): StoreMemberLifecycleStatus {
  if (input.disabledAt) {
    return 'inactive';
  }

  if (input.hasPassword) {
    return 'active';
  }

  const now = input.now ?? new Date();
  if (
    input.provisionalExpiresAt &&
    input.provisionalExpiresAt.getTime() < now.getTime()
  ) {
    return 'expired';
  }

  return 'pending';
}
