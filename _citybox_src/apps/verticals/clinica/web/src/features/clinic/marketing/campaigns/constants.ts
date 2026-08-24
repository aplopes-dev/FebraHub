import type { CampaignChannel, CampaignStatus, CampaignSegmentConfig } from "./types";

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  inactive: "Inativa",
  paused: "Pausada",
  finished: "Finalizada",
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft:
    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
  active:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  inactive:
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700",
  paused:
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  finished:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};

export const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  web: "Web",
};

export const CHANNEL_COLORS: Record<CampaignChannel, string> = {
  whatsapp: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  sms: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  web: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
};

export const FILTER_OPTIONS = [
  { value: "all", label: "Todas as campanhas" },
  { value: "active", label: "Campanhas ativas" },
  { value: "finished", label: "Campanhas finalizadas" },
  { value: "paused", label: "Campanhas pausadas" },
] as const;

export type StatusFilter = CampaignStatus | "all";

export const CAMPAIGN_SEGMENTS: CampaignSegmentConfig[] = [
  {
    id: "captacao-leads",
    label: "Captação de Leads",
    description: "Atraia novos pacientes para a clínica.",
    types: [
      {
        id: "form-lead",
        title: "Formulário de Leads",
        description: "Crie uma página de captura para ofertas ou avaliações.",
        strategy: "PAGE",
        icon: "FileText",
      },
      {
        id: "mgm",
        title: "Indique e Ganhe",
        description: "Campanha de indicação premiada para pacientes.",
        strategy: "BROADCAST",
        icon: "Share2",
      },
    ],
  },
  {
    id: "operacional-atendimento",
    label: "Operacional de Atendimento",
    description: "Gerencie avisos, agenda e financeiro.",
    types: [
      {
        id: "debito-atraso",
        title: "Débito em atraso",
        description: "Lembretes automáticos para boletos em aberto.",
        strategy: "BROADCAST",
        icon: "Wallet",
      },
      {
        id: "retorno-tratamento",
        title: "Retorno de procedimento finalizado",
        description: "Pacientes que finalizaram procedimento e precisam retornar para uma consulta.",
        strategy: "BROADCAST",
        icon: "Calendar",
      },
    ],
  },
  {
    id: "relacionamento-pos-venda",
    label: "Relacionamento & Pós-Venda",
    description: "Fidelização e pós-venda.",
    types: [
      {
        id: "aniversario",
        title: "Aniversariantes",
        description: "Envie mensagens de parabéns automáticas.",
        strategy: "BROADCAST",
        icon: "Gift",
      },
      {
        id: "nps",
        title: "Pesquisa de Satisfação",
        description: "Coleta de feedback pós-atendimento.",
        strategy: "AUTOMATION",
        icon: "Star",
      },
    ],
  },
];
