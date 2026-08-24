import {
  formatLocalDateString,
  parseLocalDateString,
} from '@/features/clinic/agenda/lib/local-date';

/** Calcula idade a partir de `yyyy-MM-dd` sem deslocamento UTC. */
export function calculateLocalAge(
  birthDate: string,
  referenceDate: Date = new Date(),
): number {
  if (!birthDate.trim()) return 0;

  const birth = parseLocalDateString(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  const dayDiff = referenceDate.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return Math.max(age, 0);
}

/** Dias até o próximo aniversário (0 = hoje). Aceita virada de ano. */
export function daysUntilNextBirthday(
  birthDate: string,
  referenceDate: Date = new Date(),
): number | null {
  if (!birthDate.trim()) return null;

  const birth = parseLocalDateString(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  let next = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < ref) {
    next = new Date(ref.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - ref.getTime()) / msPerDay);
}

/** Dias desde o aniversário mais recente (0 = hoje). */
export function daysSinceLastBirthday(
  birthDate: string,
  referenceDate: Date = new Date(),
): number | null {
  if (!birthDate.trim()) return null;

  const birth = parseLocalDateString(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  let last = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
  if (last > ref) {
    last = new Date(ref.getFullYear() - 1, birth.getMonth(), birth.getDate());
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((ref.getTime() - last.getTime()) / msPerDay);
}

export function formatLocalDateBr(dateString: string): string {
  if (!dateString) return '—';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export { formatLocalDateString, parseLocalDateString };
