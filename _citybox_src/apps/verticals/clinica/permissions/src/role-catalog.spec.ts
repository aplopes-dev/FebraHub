import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLINIC_PERMISSION_IDS } from './constants.js';
import {
  clinicPermissionLabel,
  clinicRoleLabel,
} from './role-catalog.js';

describe('clinicRoleLabel — vertente', () => {
  it('keeps generic role labels unchanged', () => {
    assert.equal(clinicRoleLabel('gerente', 'fisioterapia'), 'Gerente');
    assert.equal(clinicRoleLabel('secretario', 'odontologia'), 'Secretário(a)');
  });

  it('returns odontologia labels by default', () => {
    assert.equal(clinicRoleLabel('dentista'), 'Dentista');
    assert.equal(clinicRoleLabel('dentista_admin'), 'Dentista administrador(a)');
  });

  it('returns fisioterapia labels when strand is fisioterapia', () => {
    assert.equal(clinicRoleLabel('dentista', 'fisioterapia'), 'Fisioterapeuta');
    assert.equal(
      clinicRoleLabel('dentista_admin', 'fisioterapia'),
      'Fisioterapeuta Administrador',
    );
  });
});

describe('clinicPermissionLabel — vertente', () => {
  it('usa anamnese odontológica por padrão', () => {
    assert.equal(
      clinicPermissionLabel(CLINIC_PERMISSION_IDS.patientAnamnesis),
      'Anamnese odontológica',
    );
  });

  it('usa anamnese fisioterapêutica na vertente fisioterapia', () => {
    assert.equal(
      clinicPermissionLabel(CLINIC_PERMISSION_IDS.patientAnamnesis, 'fisioterapia'),
      'Anamnese fisioterapêutica',
    );
  });
});
