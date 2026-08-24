import { User } from '../domain/entities/user.entity';
import { UserRepository } from '../domain/repositories/user.repository.interface';

export class InMemoryUserRepository extends UserRepository {
  readonly users = new Map<string, User>();

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByKeycloakSub(keycloakSub: string): Promise<User | null> {
    const found = [...this.users.values()].find(
      (user) => user.keycloakSub === keycloakSub,
    );
    return Promise.resolve(found ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const found = [...this.users.values()].find(
      (user) => user.email === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  delete(id: string): Promise<void> {
    this.users.delete(id);
    return Promise.resolve();
  }

  clear(): void {
    this.users.clear();
  }
}
