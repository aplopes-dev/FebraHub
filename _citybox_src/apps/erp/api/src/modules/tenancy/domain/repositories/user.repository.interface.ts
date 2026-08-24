import type { User } from '../entities/user.entity';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByKeycloakSub(keycloakSub: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;

  /**
   * Só para compensação: desfaz um `User` recém-criado quando o cadastro do
   * membro falha no meio. Não é operação de negócio — remover pessoa é
   * `RemoveMember`, que apaga o vínculo e preserva a identidade.
   */
  abstract delete(id: string): Promise<void>;
}
