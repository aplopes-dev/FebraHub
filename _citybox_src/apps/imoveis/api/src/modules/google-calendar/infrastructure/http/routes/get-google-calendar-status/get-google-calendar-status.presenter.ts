import type { GetGoogleCalendarStatusOutput } from '../../../../application/use-cases/get-google-calendar-status/get-google-calendar-status.use-case';

export class GetGoogleCalendarStatusPresenter {
  static toHttp(result: GetGoogleCalendarStatusOutput) {
    return {
      data: {
        connected: result.connected,
        enabled: result.enabled,
        calendarId: result.calendarId,
        configured: result.configured,
      },
    };
  }
}
