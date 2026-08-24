import {
  assertAppointmentStatusTransition,
  canTransitionAppointmentStatus,
  isReopeningBlockingAppointmentStatus,
} from './appointment-state-machine';

describe('appointment-state-machine', () => {
  it('allows scheduled to confirmed', () => {
    expect(canTransitionAppointmentStatus('scheduled', 'confirmed')).toBe(true);
  });

  it('allows in_progress to finished', () => {
    expect(canTransitionAppointmentStatus('in_progress', 'finished')).toBe(
      true,
    );
  });

  it('allows skipping patient_waiting into in_progress', () => {
    expect(canTransitionAppointmentStatus('confirmed', 'in_progress')).toBe(
      true,
    );
    expect(canTransitionAppointmentStatus('scheduled', 'in_progress')).toBe(
      true,
    );
  });

  it('blocks finished to scheduled', () => {
    expect(canTransitionAppointmentStatus('finished', 'scheduled')).toBe(false);
  });

  it('throws on invalid transition', () => {
    expect(() =>
      assertAppointmentStatusTransition('finished', 'in_progress'),
    ).toThrow('Invalid appointment status transition');
  });

  it('allows same status', () => {
    expect(canTransitionAppointmentStatus('confirmed', 'confirmed')).toBe(true);
  });

  it('allows correcting cancel reason between patient and professional', () => {
    expect(
      canTransitionAppointmentStatus('cancelled_patient', 'cancelled_pro'),
    ).toBe(true);
    expect(
      canTransitionAppointmentStatus('cancelled_pro', 'cancelled_patient'),
    ).toBe(true);
  });

  it('allows reopening a cancelled or missed appointment', () => {
    expect(canTransitionAppointmentStatus('cancelled_pro', 'scheduled')).toBe(
      true,
    );
    expect(
      canTransitionAppointmentStatus('cancelled_patient', 'confirmed'),
    ).toBe(true);
    expect(canTransitionAppointmentStatus('missed', 'scheduled')).toBe(true);
  });

  it('detects reopen into a blocking status', () => {
    expect(
      isReopeningBlockingAppointmentStatus('cancelled_patient', 'scheduled'),
    ).toBe(true);
    expect(
      isReopeningBlockingAppointmentStatus('missed', 'patient_waiting'),
    ).toBe(true);
    expect(
      isReopeningBlockingAppointmentStatus('scheduled', 'cancelled_pro'),
    ).toBe(false);
    expect(
      isReopeningBlockingAppointmentStatus('cancelled_patient', 'cancelled_pro'),
    ).toBe(false);
  });
});
