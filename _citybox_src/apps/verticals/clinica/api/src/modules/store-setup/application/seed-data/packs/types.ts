import type {
  ClinicSeedAnamnesisQuestion,
  ClinicSeedAnamnesisTemplate,
} from '../anamnesis-templates';
import type { ClinicSeedSpecialty } from '../particular-specialties';

/** Template de first-contact por vertente — uma loja usa exatamente um pack. */
export type ClinicSeedPack = {
  version: number;
  plan: {
    name: string;
    isDefault: boolean;
    specialties: ClinicSeedSpecialty[];
  };
  anamnesis: {
    /** Odonto usa a biblioteca completa; fisio usa global (15) + extraLibrary. */
    librarySource: 'odontologia-full' | 'global-plus-extra';
    /** Perguntas adicionais além da biblioteca global (scope clinic). */
    extraLibrary: ClinicSeedAnamnesisQuestion[];
    templates: ClinicSeedAnamnesisTemplate[];
    /** Perguntas do modelo de acompanhamento (tipos próprios; lookup por texto+tipo). */
    followupLibrary?: ClinicSeedAnamnesisQuestion[];
    followupTemplateName?: string;
  };
  contract: {
    name: string;
    content: string;
    isDefault: boolean;
  };
  financialAccount: {
    name: string;
    type: string;
  };
  expenseCategories: ReadonlyArray<{ name: string; color: string }>;
  incomeCategories: ReadonlyArray<{ name: string; color: string }>;
  patientCategories: ReadonlyArray<{
    name: string;
    colorId: string;
    isProtected: boolean;
  }>;
  appointmentCategories: ReadonlyArray<{ name: string; color: string }>;
  demo: {
    patientName: string;
    durationMin: number;
    /** Categoria de agenda usada no agendamento demo (ex.: Avaliação vs Particular). */
    appointmentCategoryName: string;
  };
};
