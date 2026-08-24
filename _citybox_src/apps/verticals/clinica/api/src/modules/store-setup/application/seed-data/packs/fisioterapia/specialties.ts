import type {
  ClinicSeedSpecialty,
  ClinicSeedTreatment,
} from '../../particular-specialties';

function treatment(name: string): ClinicSeedTreatment {
  return { name, acceptsFaces: false, valueCents: 0, costCents: 0 };
}

export const FISIOTERAPIA_SPECIALTIES: ClinicSeedSpecialty[] = [
  {
    name: 'Avaliação e Consultas',
    treatments: [
      treatment('Avaliação Fisioterapêutica Inicial'),
      treatment('Consulta de Retorno'),
      treatment('Reavaliação Fisioterapêutica'),
      treatment('Consulta de Auditoria – Perícia Inicial'),
      treatment('Consulta de Auditoria – Perícia Final'),
      treatment('Falta a Consulta'),
      treatment('Orientação Domiciliar / Home Exercise Program'),
      treatment('Emissão de Relatório Fisioterapêutico'),
    ],
  },
  {
    name: 'Fisioterapia Ortopédica e Traumato-Ortopédica',
    treatments: [
      treatment('Reabilitação Pós-Cirúrgica de Ombro / Joelho / Quadril / Coluna'),
      treatment('Reabilitação de Tornozelo e Pé'),
      treatment('Reabilitação de Cotovelo, Punho e Mão'),
      treatment('Tratamento de Tendinopatias'),
      treatment('Tratamento de Bursites'),
      treatment('Tratamento de Lombalgia'),
      treatment('Tratamento de Cervicalgia'),
      treatment('Tratamento de Hérnia de Disco'),
      treatment('Tratamento de Entorses e Distensões'),
      treatment('Reabilitação Pós-Fratura'),
      treatment('Fortalecimento Muscular Analítico'),
      treatment('Cinesioterapia Ortopédica'),
    ],
  },
  {
    name: 'Terapia Manual e Procedimentos Invasivos',
    treatments: [
      treatment('Agulhamento a Seco (Dry Needling) – Cervical / Lombar / Ombro / Membros Inferiores'),
      treatment('Eletroagulhamento'),
      treatment('Punção Seca Superficial / Profunda'),
      treatment('Liberação Miofascial Instrumental (IASTM)'),
      treatment('Ventosaterapia'),
      treatment('Manipulação Articular de Alta Velocidade (Thrust)'),
      treatment('Mobilização Articular Graus I–IV (Maitland)'),
      treatment('Mobilização Neural / Neurodinâmica'),
      treatment('Mobilização com Movimento (Mulligan)'),
      treatment('Técnica de Energia Muscular'),
      treatment('Liberação Miofascial Manual'),
      treatment('Terapia de Ponto-Gatilho Miofascial'),
      treatment('Tração Manual Cervical / Lombar'),
      treatment('Bandagem Terapêutica / Kinesio Taping'),
      treatment('Mobilização de Cicatriz Pós-Cirúrgica'),
    ],
  },
  {
    name: 'Fisioterapia Neurológica',
    treatments: [
      treatment('Reabilitação Neurológica Pós-AVC'),
      treatment('Reabilitação em Lesão Medular'),
      treatment('Reabilitação em Traumatismo Cranioencefálico'),
      treatment('Tratamento de Doença de Parkinson'),
      treatment('Tratamento de Esclerose Múltipla'),
      treatment('Reabilitação em Paralisia Facial'),
      treatment('Reabilitação Vestibular'),
      treatment('Estimulação Elétrica Funcional (FES)'),
      treatment('Treino de Marcha Neurológica'),
      treatment('Facilitação Neuromuscular Proprioceptiva (FNP/Kabat)'),
      treatment('Conceito Bobath'),
    ],
  },
  {
    name: 'Fisioterapia Esportiva',
    treatments: [
      treatment('Avaliação Biomecânica do Movimento'),
      treatment('Prevenção de Lesões Esportivas'),
      treatment('Reabilitação de Lesões Ligamentares (ex.: LCA)'),
      treatment('Reabilitação de Lesões Musculares'),
      treatment('Treino de Propriocepção e Equilíbrio'),
      treatment('Treino Pliométrico Terapêutico'),
      treatment('Retorno ao Esporte / Return to Play'),
      treatment('Testes Funcionais de Performance'),
      treatment('Fisioterapia em Campo / Atendimento a Atletas'),
    ],
  },
  {
    name: 'RPG e Reeducação Postural',
    treatments: [
      treatment('Avaliação Postural Global'),
      treatment('Sessão de RPG – Postura em Pé / Deitada / Sentada'),
      treatment('Manutenção de RPG'),
      treatment('Reeducação Postural Assistida por Aparelhos'),
      treatment('Alongamento Global Ativo'),
      treatment('Correção de Desvios Posturais (Escoliose, Hipercifose, Hiperlordose)'),
    ],
  },
  {
    name: 'Fisioterapia Pélvica e Saúde da Mulher',
    treatments: [
      treatment('Avaliação Pélvica'),
      treatment('Reabilitação do Assoalho Pélvico'),
      treatment('Tratamento de Incontinência Urinária'),
      treatment('Fisioterapia no Pré-Natal'),
      treatment('Fisioterapia no Puerpério'),
      treatment('Fisioterapia na Diástase Abdominal'),
    ],
  },
  {
    name: 'Fisioterapia Cardiorrespiratória',
    treatments: [
      treatment('Avaliação Cardiorrespiratória'),
      treatment('Reexpansão Pulmonar'),
      treatment('Higiene Brônquica'),
      treatment('Reabilitação Pulmonar'),
      treatment('Reabilitação Cardíaca Fase I / II'),
      treatment('Treinamento Muscular Respiratório'),
    ],
  },
  {
    name: 'Fisioterapia Geriátrica',
    treatments: [
      treatment('Avaliação Geriátrica Fisioterapêutica'),
      treatment('Prevenção de Quedas'),
      treatment('Reabilitação da Marcha no Idoso'),
      treatment('Condicionamento Funcional Geriátrico'),
    ],
  },
  {
    name: 'DTM e Fisioterapia Orofacial',
    treatments: [
      treatment('Avaliação da Musculatura Orofacial'),
      treatment('Liberação Miofascial de Musculatura Mastigatória'),
      treatment('Mobilização Articular da ATM'),
      treatment('Agulhamento de Pontos-Gatilho Orofaciais'),
      treatment('Exercícios Terapêuticos para ATM'),
      treatment('Eletroterapia para DTM'),
      treatment('Termoterapia para DTM'),
      treatment('Orientação Postural Cervical Associada à DTM'),
    ],
  },
  {
    name: 'Drenagem Linfática e Fisioterapia Vascular',
    treatments: [
      treatment('Drenagem Linfática Manual'),
      treatment('Drenagem Linfática Mecânica (Pressoterapia)'),
      treatment('Tratamento de Linfedema'),
      treatment('Tratamento de Insuficiência Venosa'),
      treatment('Bandagem Compressiva'),
      treatment('Terapia Complexa Descongestiva'),
      treatment('Cuidados Fisioterapêuticos Pós-Mastectomia'),
    ],
  },
  {
    name: 'Fisioterapia Dermatofuncional',
    treatments: [],
  },
  {
    name: 'Fisioterapia Pediátrica',
    treatments: [],
  },
  {
    name: 'Fisioterapia do Trabalho / Ergonomia',
    treatments: [],
  },
  {
    name: 'Pilates Clínico e Condicionamento',
    treatments: [
      treatment('Pilates Solo – Individual'),
      treatment('Pilates Solo – Em Grupo'),
      treatment('Pilates com Aparelhos – Reformer / Cadillac / Chair / Barrel'),
      treatment('Treinamento Funcional'),
      treatment('Treinamento Resistido / Musculação Terapêutica'),
      treatment('Condicionamento Cardiorrespiratório'),
      treatment('Avaliação Postural para Pilates'),
      treatment('Pilates para Gestantes'),
      treatment('Pilates para Terceira Idade'),
    ],
  },
  {
    name: 'Fisioterapia Aquática / Hidroterapia',
    treatments: [
      treatment('Hidrocinesioterapia – Sessão Individual / Em Grupo'),
      treatment('Reabilitação Aquática Pós-Cirúrgica'),
      treatment('Hidroterapia para Gestantes'),
      treatment('Método Bad Ragaz'),
      treatment('Ai-Chi'),
    ],
  },
  {
    name: 'Confecção e Adaptação de Órteses',
    treatments: [
      treatment('Confecção de Órtese para Punho / Joelho / Tornozelo'),
      treatment('Adaptação de Palmilhas Terapêuticas'),
      treatment('Adaptação de Bengalas e Muletas'),
      treatment('Adaptação de Andadores'),
      treatment('Confecção de Tala Termoplástica'),
      treatment('Ajuste de Órtese Pré-fabricada'),
    ],
  },
  {
    name: 'Avaliação Física e Exames Funcionais',
    treatments: [
      treatment('Avaliação Postural Fotográfica'),
      treatment('Goniometria'),
      treatment('Teste de Força Muscular Manual'),
      treatment('Dinamometria'),
      treatment('Baropodometria'),
      treatment('Avaliação de Marcha'),
      treatment('Fotogrametria'),
      treatment('Avaliação de Amplitude de Movimento (ADM)'),
      treatment('Teste de Flexibilidade'),
    ],
  },
  {
    name: 'Testes e Avaliações Especializadas',
    treatments: [
      treatment('Eletromiografia de Superfície'),
      treatment('Teste Isocinético'),
      treatment('Teste de Esforço Cardiopulmonar (VO2)'),
      treatment('Teste de Caminhada de 6 Minutos'),
      treatment('Escala de Equilíbrio de Berg'),
      treatment('Avaliação de Função Pulmonar (Espirometria)'),
    ],
  },
  {
    name: 'Prevenção e Educação em Saúde',
    treatments: [
      treatment('Orientação Postural'),
      treatment('Orientação Ergonômica'),
      treatment('Programa de Prevenção de Quedas (Idosos)'),
      treatment('Programa de Prevenção de Lesões Esportivas'),
      treatment('Palestra Educativa em Saúde'),
      treatment('Escola de Coluna'),
      treatment('Ginástica Laboral'),
    ],
  },
  {
    name: 'Urgência / Atendimento Agudo',
    treatments: [
      treatment('Atendimento Fisioterapêutico de Urgência'),
      treatment('Atendimento de Urgência 24 horas'),
      treatment('Manejo de Dor Aguda'),
      treatment('Crioterapia de Urgência'),
      treatment('Imobilização Provisória'),
      treatment('Orientação em Lesão Aguda (Protocolo POLICE)'),
    ],
  },
];

export const FISIOTERAPIA_SPECIALTY_NAMES = FISIOTERAPIA_SPECIALTIES.map(
  (specialty) => specialty.name,
) as readonly string[];
