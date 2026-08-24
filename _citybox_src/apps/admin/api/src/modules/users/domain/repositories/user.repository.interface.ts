import type { PlatformRole, User } from '../entities/user.entity';

export type UserListCriteria = {
  skip?: number;
  take?: number;
  search?: string;
  roles?: PlatformRole[];
};

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByKeycloakSub(keycloakSub: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(criteria?: UserListCriteria): Promise<User[]>;
  abstract count(criteria?: UserListCriteria): Promise<number>;
  abstract save(user: User): Promise<User>;
  abstract delete(id: string): Promise<void>;
}
