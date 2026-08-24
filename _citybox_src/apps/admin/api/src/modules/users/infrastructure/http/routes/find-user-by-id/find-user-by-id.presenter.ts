import type { User } from '../../../../domain/entities/user.entity';

export class FindUserByIdPresenter {
  static toHttp(user: User) {
    return {
      data: {
        id: user.id,
        keycloakSub: user.keycloakSub,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
