import type { ReturnOption } from './scheduling-enums';

export function computeReturnDate(
  referenceDate: Date,
  returnOption: ReturnOption,
  customReturnDate?: Date | null,
): Date | null {
  if (returnOption === 'none') return null;
  if (returnOption === 'custom_date') {
    return customReturnDate ?? null;
  }

  const result = new Date(referenceDate);
  switch (returnOption) {
    case 'one_month':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'six_months':
      result.setMonth(result.getMonth() + 6);
      break;
    case 'twelve_months':
      result.setFullYear(result.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return result;
}
