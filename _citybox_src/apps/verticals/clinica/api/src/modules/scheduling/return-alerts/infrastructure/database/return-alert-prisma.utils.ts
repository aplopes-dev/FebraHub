import { $Enums } from '../../../../../../generated/prisma/client';
import type { ReturnAlertSource as DomainReturnAlertSource } from '../../../shared/domain/scheduling-enums';

export function toPrismaReturnAlertSource(
  source: DomainReturnAlertSource,
): $Enums.ReturnAlertSource {
  return source === 'auto'
    ? $Enums.ReturnAlertSource.auto
    : $Enums.ReturnAlertSource.manual;
}

export function toDomainReturnAlertSource(
  source: $Enums.ReturnAlertSource,
): DomainReturnAlertSource {
  return source;
}
