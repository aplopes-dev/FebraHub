export function calculateAge(birthDate: string, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  const dayDiff = referenceDate.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return Math.max(age, 0);
}
