import type { GetGoogleCalendarAuthUrlOutput } from '../../../../application/use-cases/get-google-calendar-auth-url/get-google-calendar-auth-url.use-case';

export class GetGoogleCalendarAuthUrlPresenter {
  static toHttp(result: GetGoogleCalendarAuthUrlOutput) {
    return {
      data: {
        url: result.url,
        configured: result.configured,
      },
    };
  }
}
