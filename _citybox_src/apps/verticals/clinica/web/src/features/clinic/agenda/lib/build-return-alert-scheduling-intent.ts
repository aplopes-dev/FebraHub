import { format } from 'date-fns';

import type { SchedulingInitialData } from '../contexts/scheduling-sheet-context';
import type { IReturnAlert } from '../components/header/return-alert/types';

type BuildReturnAlertSchedulingIntentInput = {
  alert: IReturnAlert;
  patientCategoryName?: string | null;
};

export function buildReturnAlertSchedulingIntent({
  alert,
  patientCategoryName,
}: BuildReturnAlertSchedulingIntentInput): SchedulingInitialData {
  return {
    type: 'appointment',
    patientId: alert.patient.id,
    patientName: alert.patient.name,
    professionalId: alert.professional.id,
    categoryName: patientCategoryName ?? undefined,
    date: format(new Date(alert.returnDate), 'yyyy-MM-dd'),
    observation: alert.reason ?? undefined,
    _returnAlertId: alert.id,
  };
}
