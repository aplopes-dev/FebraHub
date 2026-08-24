import type { GetRemindersResult } from '../../../../application/use-cases/get-reminders/get-reminders.use-case';

export class GetRemindersPresenter {
  static toHttp(result: GetRemindersResult) {
    return {
      data: result.reminders.map((reminder) => ({
        kind: reminder.kind,
        title: reminder.title,
        description: reminder.description,
        progress: reminder.progress,
        people: reminder.people,
        totalPeople: reminder.totalPeople,
        isHighlighted: reminder.isHighlighted,
        href: reminder.href,
      })),
    };
  }
}
