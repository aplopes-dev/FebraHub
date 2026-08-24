import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectLeadPropertyCandidateIds } from './build-prefill-from-lead';
import type { ContactLeadDetail } from '@/features/leads/types';

function makeLead(
  overrides: Partial<ContactLeadDetail> = {},
): ContactLeadDetail {
  return {
    id: 'lead-1',
    name: 'Maria',
    email: '',
    phone: '',
    city: '',
    state: '',
    initials: 'M',
    status: 'negotiating',
    intent: 'Casa — Comprar',
    budgetLabel: '',
    lastContactedAt: '2026-01-01',
    leadSource: 'website',
    interestedPropertyType: 'house',
    purpose: 'buying',
    budgetRange: '',
    preferredLocation: '',
    latestFollowUp: '',
    nextFollowUp: '',
    notes: '',
    agentIds: [],
    matchedProperties: [
      { id: 'prop-a', name: 'Casa A' },
      { id: 'prop-b', name: 'Casa B' },
    ],
    documents: [],
    activities: [],
    createdAt: '2026-01-01',
    ...overrides,
  };
}

describe('collectLeadPropertyCandidateIds', () => {
  it('puts preferred deal property first, then remaining matched', () => {
    const ids = collectLeadPropertyCandidateIds(makeLead(), 'prop-b');
    assert.deepEqual(ids, ['prop-b', 'prop-a']);
  });

  it('uses activeDeal property before other matched when no preferred', () => {
    const ids = collectLeadPropertyCandidateIds(
      makeLead({
        activeDeal: {
          id: 'deal-1',
          stage: 'contract_signed',
          status: 'active',
          propertyId: 'prop-a',
          propertyName: 'Casa A',
          title: 'Negócio',
        },
      }),
    );
    assert.deepEqual(ids, ['prop-a', 'prop-b']);
  });

  it('dedupes preferred and matched ids', () => {
    const ids = collectLeadPropertyCandidateIds(
      makeLead({
        activeDeal: {
          id: 'deal-1',
          stage: 'property_selected',
          status: 'active',
          propertyId: 'prop-a',
          propertyName: 'Casa A',
          title: 'Negócio',
        },
      }),
      'prop-a',
    );
    assert.deepEqual(ids, ['prop-a', 'prop-b']);
  });
});
