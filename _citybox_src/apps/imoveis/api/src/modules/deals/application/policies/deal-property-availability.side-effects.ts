import type { ApiPropertyStatus } from '../../../properties/domain/mappers/property-enum.mapper';
import type { PropertyEntity } from '../../../properties/domain/entities/property.entity';
import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';
import { reopenPropertyIfAllowed } from '../../../transactions/application/policies/transaction-cancel.side-effects';
import type { DealStage } from '../../domain/entities/deal.entity';

/**
 * Status alvo na esteira (imóvel de 1 unidade):
 * - property_selected → reserved (Em espera)
 * - contract_sent+ → occupied (Ocupado)
 *
 * Multiunidade (`units > 1`): só incrementa/decrementa `occupiedUnits`
 * enquanto ainda houver unidade livre — o imóvel continua selecionável.
 */
export function propertyStatusForDealStage(
  stage: DealStage,
): ApiPropertyStatus | null {
  if (stage === 'awaiting_property') return 'available';
  if (stage === 'property_selected') return 'reserved';
  if (
    stage === 'contract_sent' ||
    stage === 'contract_signed' ||
    stage === 'payment_confirmed'
  ) {
    return 'occupied';
  }
  return null;
}

function unitsTotal(property: PropertyEntity): number {
  return Math.max(1, property.units || 1);
}

function occupiedCount(property: PropertyEntity): number {
  if (property.occupiedUnits != null) {
    return Math.max(0, property.occupiedUnits);
  }
  if (property.status === 'available') return 0;
  return unitsTotal(property);
}

function freeUnits(property: PropertyEntity): number {
  return Math.max(0, unitsTotal(property) - occupiedCount(property));
}

async function holdUnitForStage(
  storeId: string,
  property: PropertyEntity,
  targetStatus: ApiPropertyStatus,
  deps: { properties: PropertyRepository },
): Promise<void> {
  if (property.status === 'sold-out') return;
  if (targetStatus === 'available') return;

  const total = unitsTotal(property);
  const occupied = occupiedCount(property);
  const free = freeUnits(property);

  if (free <= 0 && property.status === targetStatus) return;

  if (total > 1 && free > 1) {
    await deps.properties.updateAvailability(
      storeId,
      property.id,
      'available',
      {
        occupiedUnits: occupied + 1,
      },
    );
    return;
  }

  if (total > 1 && free === 1) {
    await deps.properties.updateAvailability(
      storeId,
      property.id,
      targetStatus,
      {
        occupiedUnits: total,
      },
    );
    return;
  }

  if (property.status === targetStatus) return;
  await deps.properties.updateAvailability(storeId, property.id, targetStatus, {
    occupiedUnits: null,
  });
}

/**
 * Ajusta disponibilidade do imóvel conforme a etapa do negócio.
 * Se o imóvel anterior mudou, libera uma unidade do antigo e prende no novo.
 */
export async function applyDealPropertyAvailabilitySideEffects(
  storeId: string,
  input: {
    previousPropertyId: string | null;
    nextPropertyId: string | null;
    nextStage: DealStage;
  },
  deps: {
    properties: PropertyRepository;
    transactions: TransactionRepository;
  },
  excludeTransactionId?: string,
): Promise<void> {
  const previousId = input.previousPropertyId?.trim() || null;
  const nextId = input.nextPropertyId?.trim() || null;

  if (previousId && previousId !== nextId) {
    await reopenPropertyIfAllowed(
      storeId,
      previousId,
      deps,
      excludeTransactionId,
    );
  }

  if (!nextId) return;

  const target = propertyStatusForDealStage(input.nextStage);
  if (!target) return;

  if (target === 'available') {
    await reopenPropertyIfAllowed(storeId, nextId, deps, excludeTransactionId);
    return;
  }

  const property = await deps.properties.findById(storeId, nextId);
  if (!property) return;

  // Mesmo imóvel avançando reserved → occupied (1 unidade).
  if (previousId === nextId) {
    const total = unitsTotal(property);
    const free = freeUnits(property);
    if (total > 1 && free > 0 && property.status === 'available') {
      // Multiunidade parcial: contagem já feita no hold; não muda status.
      return;
    }
    if (property.status === target) return;
    if (total <= 1 || free <= 0) {
      await deps.properties.updateAvailability(storeId, nextId, target, {
        occupiedUnits: total > 1 ? total : null,
      });
    }
    return;
  }

  await holdUnitForStage(storeId, property, target, deps);
}
