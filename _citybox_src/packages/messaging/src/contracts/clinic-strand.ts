/**
 * Vertente **dentro** da vertical Clínica — uma loja tem exatamente uma.
 *
 * Distinto de `StorePlatformVertical` (`'Clínica'`): a vertical é o sistema;
 * a vertente escolhe o pack de first-contact (odonto, fisio, …).
 *
 * Evolução só aditiva: novos ids entram no array; ids antigos não saem enquanto
 * houver loja persistida com eles.
 */

export const CLINIC_STRANDS = [
  'odontologia',
  'fisioterapia',
  'nutricao',
] as const;

export type ClinicStrand = (typeof CLINIC_STRANDS)[number];

export const DEFAULT_CLINIC_STRAND: ClinicStrand = 'odontologia';

export type ClinicLocationMap = 'tooth' | 'face' | 'body';

export type ClinicStrandFeatures = {
  locationMaps: readonly ClinicLocationMap[];
  showImc: boolean;
  /** Campo Sessões no orçamento (expande N linhas quando N≥2). */
  budgetTreatmentSessions: boolean;
  /**
   * Nutrição: botão Inicializar (em vez de Finalizar) abre modal
   * Anamnese / Corporal / Plano e anexa card na evolução.
   */
  showNutritionInitializeFlow: boolean;
  councilTypes: readonly string[];
};

export type ClinicStrandCopy = {
  roleLabels: {
    professional: string;
    admin: string;
  };
  permissionLabels: {
    patientAnamnesis: string;
  };
};

export type ClinicStrandDefinition = {
  id: ClinicStrand;
  label: string;
  features: ClinicStrandFeatures;
  copy: ClinicStrandCopy;
};

export const CLINIC_STRAND_CATALOG: Record<ClinicStrand, ClinicStrandDefinition> =
  {
    odontologia: {
      id: 'odontologia',
      label: 'Odontologia',
      features: {
        locationMaps: ['tooth', 'face'],
        showImc: false,
        budgetTreatmentSessions: false,
        showNutritionInitializeFlow: false,
        councilTypes: ['CRO', 'CRM'],
      },
      copy: {
        roleLabels: {
          professional: 'Dentista',
          admin: 'Dentista administrador(a)',
        },
        permissionLabels: {
          patientAnamnesis: 'Anamnese odontológica',
        },
      },
    },
    fisioterapia: {
      id: 'fisioterapia',
      label: 'Fisioterapia',
      features: {
        locationMaps: ['body'],
        showImc: true,
        budgetTreatmentSessions: true,
        showNutritionInitializeFlow: false,
        councilTypes: ['CREFITO'],
      },
      copy: {
        roleLabels: {
          professional: 'Fisioterapeuta',
          admin: 'Fisioterapeuta Administrador',
        },
        permissionLabels: {
          patientAnamnesis: 'Anamnese fisioterapêutica',
        },
      },
    },
    nutricao: {
      id: 'nutricao',
      label: 'Nutrição',
      features: {
        locationMaps: [],
        showImc: false,
        budgetTreatmentSessions: false,
        showNutritionInitializeFlow: true,
        councilTypes: ['CRN'],
      },
      copy: {
        roleLabels: {
          professional: 'Nutricionista',
          admin: 'Nutricionista Administrador',
        },
        permissionLabels: {
          patientAnamnesis: 'Anamnese nutricional',
        },
      },
    },
  };

export function isClinicStrand(value: string): value is ClinicStrand {
  return (CLINIC_STRANDS as readonly string[]).includes(value);
}

/**
 * Interpreta o campo opcional do evento/DTO.
 * - ausente ou vazio → `undefined` (o caller aplica o default)
 * - valor válido → o id
 * - valor inválido → `null` (o caller responde 422)
 */
export function parseClinicStrand(
  value: string | null | undefined,
): ClinicStrand | null | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (isClinicStrand(trimmed)) return trimmed;
  return null;
}

/** Ausente/vazio → odontologia. Inválido lança. */
export function resolveClinicStrand(
  value: string | null | undefined,
): ClinicStrand {
  const parsed = parseClinicStrand(value);
  if (parsed === null) {
    throw new Error(`Invalid clinicStrand: ${String(value)}`);
  }
  return parsed ?? DEFAULT_CLINIC_STRAND;
}

export function getClinicStrandDefinition(
  strand: ClinicStrand,
): ClinicStrandDefinition {
  return CLINIC_STRAND_CATALOG[strand];
}
