import { describe, expect, it, vi } from 'vitest';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { getSignatureCredits } from '../services/signature-packages.api.service';
import {
  SIGNATURE_CREDITS_INSUFFICIENT_MESSAGE,
  isSignatureCreditBalanceEmpty,
  isSignatureCreditsInsufficientError,
} from './signature-credits-insufficient';

vi.mock('../services/signature-packages.api.service', () => ({
  getSignatureCredits: vi.fn(),
}));

const getSignatureCreditsMock = vi.mocked(getSignatureCredits);

describe('isSignatureCreditsInsufficientError', () => {
  it('detecta ClinicaApiError com a mensagem de saldo', () => {
    expect(
      isSignatureCreditsInsufficientError(
        new ClinicaApiError(422, SIGNATURE_CREDITS_INSUFFICIENT_MESSAGE),
      ),
    ).toBe(true);
  });

  it('ignora outros erros', () => {
    expect(isSignatureCreditsInsufficientError(new Error('outro'))).toBe(false);
    expect(isSignatureCreditsInsufficientError(null)).toBe(false);
  });
});

describe('isSignatureCreditBalanceEmpty', () => {
  it('returns true when the store has no signature credits', async () => {
    getSignatureCreditsMock.mockResolvedValueOnce({
      storeId: 'store-1',
      balance: 0,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z',
    });

    await expect(isSignatureCreditBalanceEmpty('store-1')).resolves.toBe(true);
  });

  it('returns false when the store has credits', async () => {
    getSignatureCreditsMock.mockResolvedValueOnce({
      storeId: 'store-1',
      balance: 3,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z',
    });

    await expect(isSignatureCreditBalanceEmpty('store-1')).resolves.toBe(false);
  });

  it('returns false when the credit lookup fails so the API can decide', async () => {
    getSignatureCreditsMock.mockRejectedValueOnce(new ClinicaApiError(403, 'Forbidden'));

    await expect(isSignatureCreditBalanceEmpty('store-1')).resolves.toBe(false);
  });
});
