import {
  UserRepository,
  type UserListCriteria,
} from '../domain/repositories/user.repository.interface';
import { User } from '../domain/entities/user.entity';

export class InMemoryUserRepository extends UserRepository {
  private items: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.items.find((u) => u.id === id) ?? null;
  }

  async findByKeycloakSub(keycloakSub: string): Promise<User | null> {
    return this.items.find((u) => u.keycloakSub === keycloakSub) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email) ?? null;
  }

  async findAll(criteria?: UserListCriteria): Promise<User[]> {
    let result = this.applyFilters(criteria);
    if (criteria?.skip) result = result.slice(criteria.skip);
    if (criteria?.take !== undefined) result = result.slice(0, criteria.take);
    return result;
  }

  async count(criteria?: UserListCriteria): Promise<number> {
    return this.applyFilters(criteria).length;
  }

  async save(user: User): Promise<User> {
    const index = this.items.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      this.items[index] = user;
    } else {
      this.items.push(user);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((u) => u.id !== id);
  }

  getAll(): User[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  private applyFilters(criteria?: UserListCriteria): User[] {
    let result = [...this.items];
    const search = criteria?.search?.trim().toLowerCase();

    if (criteria?.roles?.length) {
      result = result.filter((user) => criteria.roles!.includes(user.role));
    }

    if (search) {
      result = result.filter((user) => {
        const displayName = (user.displayName ?? '').toLowerCase();
        const email = (user.email ?? '').toLowerCase();
        return displayName.includes(search) || email.includes(search);
      });
    }

    return result;
  }
}
