import { Prisma } from '../../../../../../generated/prisma/client';

export function isAppointmentSlotTakenError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('appointments_professional_no_overlap') ||
    message.includes('exclusion constraint') ||
    message.includes('23P01')
  );
}
