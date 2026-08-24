import type { User } from '../../../../domain/entities/user.entity';

export class ListUsersPresenter {
  static toHttp(
    users: User[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: users.map((u) => ({
        id: u.id,
        keycloakSub: u.keycloakSub,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      meta,
    };
  }
}
