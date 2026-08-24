import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ToothFacesNotAcceptedError } from '../../domain/errors/tooth-faces-not-accepted.error';
import { resolveBudgetToothLocationLabel } from './resolve-budget-tooth-location-label';

describe('resolveBudgetToothLocationLabel', () => {
  it('normalizes tooth label with faces when treatment accepts faces', () => {
    expect(
      resolveBudgetToothLocationLabel({
        context: 'Test',
        locationType: 'tooth',
        locationLabel: '15 · D,M',
        treatmentId: 'tr-1',
        acceptsFaces: true,
      }),
    ).toBe('15 · M,D');
  });

  it('rejects faces when treatment does not accept faces', () => {
    expect(() =>
      resolveBudgetToothLocationLabel({
        context: 'Test',
        locationType: 'tooth',
        locationLabel: '15 · M',
        treatmentId: 'tr-1',
        acceptsFaces: false,
      }),
    ).toThrow(ToothFacesNotAcceptedError);
  });

  it('allows tooth number without faces when acceptsFaces is false', () => {
    expect(
      resolveBudgetToothLocationLabel({
        context: 'Test',
        locationType: 'tooth',
        locationLabel: '15',
        treatmentId: 'tr-1',
        acceptsFaces: false,
      }),
    ).toBe('15');
  });

  it('rejects invalid tooth location label', () => {
    expect(() =>
      resolveBudgetToothLocationLabel({
        context: 'Test',
        locationType: 'tooth',
        locationLabel: 'Maxila',
        treatmentId: 'tr-1',
        acceptsFaces: true,
      }),
    ).toThrow(ValidatorDomainError);
  });

  it('passes through non-tooth locations', () => {
    expect(
      resolveBudgetToothLocationLabel({
        context: 'Test',
        locationType: 'body_region',
        locationLabel: ' Maxila ',
        treatmentId: 'tr-1',
        acceptsFaces: false,
      }),
    ).toBe('Maxila');
  });
});
