import { InMemoryPropertyRepository } from '../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../transactions/infrastructure/database/in-memory-transaction.repository';
import {
  applyDealPropertyAvailabilitySideEffects,
  propertyStatusForDealStage,
} from './deal-property-availability.side-effects';

const STORE = 'store-1';

describe('deal-property-availability.side-effects', () => {
  it('maps deal stages to property statuses', () => {
    expect(propertyStatusForDealStage('awaiting_property')).toBe('available');
    expect(propertyStatusForDealStage('property_selected')).toBe('reserved');
    expect(propertyStatusForDealStage('contract_sent')).toBe('occupied');
    expect(propertyStatusForDealStage('contract_signed')).toBe('occupied');
    expect(propertyStatusForDealStage('payment_confirmed')).toBe('occupied');
    expect(propertyStatusForDealStage('handover')).toBeNull();
  });

  it('reserves single-unit property on property_selected', async () => {
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      units: 1,
    });

    await applyDealPropertyAvailabilitySideEffects(
      STORE,
      {
        previousPropertyId: null,
        nextPropertyId: property.id,
        nextStage: 'property_selected',
      },
      { properties, transactions },
    );
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'reserved',
    );
  });

  it('only increments occupiedUnits on multi-unit while free remain', async () => {
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const property = await properties.create({
      storeId: STORE,
      name: 'Prédio',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      units: 4,
      occupiedUnits: 0,
    });

    await applyDealPropertyAvailabilitySideEffects(
      STORE,
      {
        previousPropertyId: null,
        nextPropertyId: property.id,
        nextStage: 'property_selected',
      },
      { properties, transactions },
    );

    const after = await properties.findById(STORE, property.id);
    expect(after?.status).toBe('available');
    expect(after?.occupiedUnits).toBe(1);
  });

  it('locks last multi-unit to reserved when taking the last free unit', async () => {
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const property = await properties.create({
      storeId: STORE,
      name: 'Prédio',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      units: 3,
      occupiedUnits: 2,
    });

    await applyDealPropertyAvailabilitySideEffects(
      STORE,
      {
        previousPropertyId: null,
        nextPropertyId: property.id,
        nextStage: 'property_selected',
      },
      { properties, transactions },
    );

    const after = await properties.findById(STORE, property.id);
    expect(after?.status).toBe('reserved');
    expect(after?.occupiedUnits).toBe(3);
  });

  it('occupies single-unit on contract_sent', async () => {
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'reserved',
      listingType: 'sale',
      units: 1,
    });

    await applyDealPropertyAvailabilitySideEffects(
      STORE,
      {
        previousPropertyId: property.id,
        nextPropertyId: property.id,
        nextStage: 'contract_sent',
      },
      { properties, transactions },
    );
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'occupied',
    );
  });

  it('releases previous multi-unit count when switching property', async () => {
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const first = await properties.create({
      storeId: STORE,
      name: 'A',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      units: 5,
      occupiedUnits: 2,
    });
    const second = await properties.create({
      storeId: STORE,
      name: 'B',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      units: 1,
    });

    await applyDealPropertyAvailabilitySideEffects(
      STORE,
      {
        previousPropertyId: first.id,
        nextPropertyId: second.id,
        nextStage: 'property_selected',
      },
      { properties, transactions },
    );

    expect((await properties.findById(STORE, first.id))?.occupiedUnits).toBe(1);
    expect((await properties.findById(STORE, first.id))?.status).toBe(
      'available',
    );
    expect((await properties.findById(STORE, second.id))?.status).toBe(
      'reserved',
    );
  });
});
