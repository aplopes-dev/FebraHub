import { CardContractRepository } from '../../domain/repositories/card-contract.repository.interface';
import { CardContractNotFoundError } from '../../domain/errors/card-contract-not-found.error';

/**
 * Confere que o contrato existe, é da organização ativa e não está excluído.
 *
 * Toda rota de forma de pagamento passa por aqui: sem isso, saber o id de um
 * contrato de outra empresa daria acesso às taxas negociadas por ela.
 */
export async function assertCardContractExists(
  cardContractRepository: CardContractRepository,
  organizationId: string,
  contractId: string,
): Promise<void> {
  const item = await cardContractRepository.findById(
    organizationId,
    contractId,
  );
  if (!item || item.contract.deletedAt) {
    throw new CardContractNotFoundError(contractId);
  }
}
