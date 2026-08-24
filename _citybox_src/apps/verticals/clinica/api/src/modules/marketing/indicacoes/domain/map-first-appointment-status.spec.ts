import { mapFirstAppointmentStatus } from './map-first-appointment-status';

describe('mapFirstAppointmentStatus', () => {
  it('maps finished to realizada', () => {
    expect(mapFirstAppointmentStatus('finished')).toBe('realizada');
  });

  it('maps missed and missing to nao_realizada', () => {
    expect(mapFirstAppointmentStatus('missed')).toBe('nao_realizada');
    expect(mapFirstAppointmentStatus(null)).toBe('nao_realizada');
    expect(mapFirstAppointmentStatus(undefined)).toBe('nao_realizada');
  });

  it('maps open statuses to agendada', () => {
    expect(mapFirstAppointmentStatus('scheduled')).toBe('agendada');
    expect(mapFirstAppointmentStatus('confirmed')).toBe('agendada');
    expect(mapFirstAppointmentStatus('patient_waiting')).toBe('agendada');
    expect(mapFirstAppointmentStatus('in_progress')).toBe('agendada');
  });
});
