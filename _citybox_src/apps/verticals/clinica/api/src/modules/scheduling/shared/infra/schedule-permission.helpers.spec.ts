import { ForbiddenException } from '@nestjs/common';
import { defineAbilityFor } from '@citybox/clinica-permissions';
import {
  assertCanWriteAppointmentProfessional,
  assertCanWriteCommitmentProfessional,
  resolveScheduleProfessionalFilter,
} from './schedule-permission.helpers';

describe('resolveScheduleProfessionalFilter', () => {
  it('forces own agenda without view_all', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_view_menu', 'schedule_attend'],
    });
    expect(
      resolveScheduleProfessionalFilter(ability, 'member-1', ['other']),
    ).toEqual(['member-1']);
  });

  it('keeps requested filter with view_all', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_view_menu', 'schedule_view_all'],
    });
    expect(
      resolveScheduleProfessionalFilter(ability, 'member-1', ['a', 'b']),
    ).toEqual(['a', 'b']);
    expect(
      resolveScheduleProfessionalFilter(ability, 'member-1', undefined),
    ).toBeUndefined();
  });
});

describe('assertCanWriteAppointmentProfessional', () => {
  it('allows any professional with attend', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_attend'],
    });
    expect(() =>
      assertCanWriteAppointmentProfessional(ability, 'me', 'other'),
    ).not.toThrow();
  });

  it('rejects without attend', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_create_for_others'],
    });
    expect(() =>
      assertCanWriteAppointmentProfessional(ability, 'me', 'other'),
    ).toThrow(ForbiddenException);
  });
});

describe('assertCanWriteCommitmentProfessional', () => {
  it('allows self with attend', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_attend'],
    });
    expect(() =>
      assertCanWriteCommitmentProfessional(ability, 'me', 'me'),
    ).not.toThrow();
  });

  it('rejects others without create_for_others', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_attend'],
    });
    expect(() =>
      assertCanWriteCommitmentProfessional(ability, 'me', 'other'),
    ).toThrow(ForbiddenException);
  });

  it('allows others with create_for_others', () => {
    const ability = defineAbilityFor({
      userId: 'u',
      permissions: ['schedule_create_for_others'],
    });
    expect(() =>
      assertCanWriteCommitmentProfessional(ability, 'me', 'other'),
    ).not.toThrow();
  });
});
