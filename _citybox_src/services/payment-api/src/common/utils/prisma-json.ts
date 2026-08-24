import type { Prisma } from '../../generated/prisma/client.js';

export function toJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}
