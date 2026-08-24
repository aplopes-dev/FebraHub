import type { Campaign } from "./campaign.model";
import type { CampaignSubmission } from "./submission.model";
import type { PublicCampaignData } from "./campaign-public.model";

/**
 * Seed em memória residual — form público e submissões (fora do backoffice API).
 * Lista/create/detalhe de campanhas autenticadas usam clinica-api.
 */

const BASE_PUBLIC_URL = "https://clinica.citybox.app/c";

function daysFromNow(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function buildMockCampaigns(): Campaign[] {
  return [
    {
      id: "camp-1001",
      clinicId: "clinic-1",
      name: "Avaliação Gratuita de Ortodontia",
      slug: "avaliacao-ortodontia",
      segment: "captacao_leads",
      type: "form_lead",
      strategy: "PAGE",
      status: "active",
      channel: "web",
      statusType: "always_active",
      startDate: daysFromNow(-30),
      views: 1280,
      submissions: 214,
      funnelId: "funnel-comercial",
      stageId: "stage-novo",
      publicUrl: `${BASE_PUBLIC_URL}/avaliacao-ortodontia`,
      content: {
        stepThree: {
          introText:
            "Preencha o formulário e agende sua avaliação ortodôntica sem custo.",
          questions: [
            {
              id: "q-nome",
              type: "text",
              label: "Nome completo",
              required: true,
            },
            {
              id: "q-tel",
              type: "phone",
              label: "WhatsApp",
              required: true,
            },
            {
              id: "q-email",
              type: "email",
              label: "E-mail",
              required: false,
            },
          ],
          lgpdConsent: {
            text: "Autorizo o contato da clínica pelos dados informados.",
          },
          primaryColor: "#2563eb",
        },
      },
      createdAt: daysFromNow(-30),
      updatedAt: daysFromNow(-2),
    },
    {
      id: "camp-1002",
      clinicId: "clinic-1",
      name: "Indique e Ganhe — Clareamento",
      slug: "indique-e-ganhe",
      segment: "captacao_leads",
      type: "mgm",
      strategy: "BROADCAST",
      status: "active",
      channel: "whatsapp",
      statusType: "period",
      startDate: daysFromNow(-14),
      endDate: daysFromNow(30),
      views: 640,
      submissions: 96,
      publicUrl: `${BASE_PUBLIC_URL}/indique-e-ganhe`,
      content: {},
      createdAt: daysFromNow(-14),
      updatedAt: daysFromNow(-1),
    },
    {
      id: "camp-1003",
      clinicId: "clinic-1",
      name: "Cobrança de Débitos em Atraso",
      slug: "debitos-em-atraso",
      segment: "operacional_atendimento",
      type: "debito_atraso",
      strategy: "BROADCAST",
      status: "paused",
      channel: "sms",
      statusType: "always_active",
      startDate: daysFromNow(-60),
      views: 320,
      submissions: 41,
      content: {},
      createdAt: daysFromNow(-60),
      updatedAt: daysFromNow(-10),
    },
    {
      id: "camp-1004",
      clinicId: "clinic-1",
      name: "Aniversariantes do Mês",
      slug: "aniversariantes",
      segment: "relacionamento_pos_venda",
      type: "aniversario",
      strategy: "BROADCAST",
      status: "active",
      channel: "whatsapp",
      statusType: "always_active",
      startDate: daysFromNow(-90),
      views: 890,
      submissions: 132,
      content: {},
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-3),
    },
    {
      id: "camp-1005",
      clinicId: "clinic-1",
      name: "Pesquisa de Satisfação (NPS)",
      slug: "pesquisa-nps",
      segment: "relacionamento_pos_venda",
      type: "nps",
      strategy: "AUTOMATION",
      status: "finished",
      channel: "web",
      statusType: "period",
      startDate: daysFromNow(-120),
      endDate: daysFromNow(-15),
      views: 540,
      submissions: 298,
      publicUrl: `${BASE_PUBLIC_URL}/pesquisa-nps`,
      content: {},
      createdAt: daysFromNow(-120),
      updatedAt: daysFromNow(-15),
    },
  ];
}

export function buildMockSubmissions(): CampaignSubmission[] {
  return [
    {
      id: "sub-2001",
      campaignId: "camp-1001",
      campaignType: "form_lead",
      submittedAt: daysFromNow(-1),
      source: "web",
      payload: {
        "Nome completo": "Marina Souza",
        WhatsApp: "(73) 98812-4477",
        "E-mail": "marina.souza@email.com",
      },
      metadata: { ip: "177.0.0.10", userAgent: "Chrome" },
      createdAt: daysFromNow(-1),
      updatedAt: daysFromNow(-1),
    },
    {
      id: "sub-2002",
      campaignId: "camp-1001",
      campaignType: "form_lead",
      submittedAt: daysFromNow(-2),
      source: "web",
      payload: {
        "Nome completo": "João Prado",
        WhatsApp: "(73) 99123-8890",
        "E-mail": "joao.prado@email.com",
      },
      metadata: { ip: "177.0.0.11", userAgent: "Safari" },
      createdAt: daysFromNow(-2),
      updatedAt: daysFromNow(-2),
    },
    {
      id: "sub-2003",
      campaignId: "camp-1001",
      campaignType: "form_lead",
      submittedAt: daysFromNow(-3),
      source: "web",
      payload: {
        "Nome completo": "Carla Menezes",
        WhatsApp: "(73) 98800-1122",
      },
      metadata: { ip: "177.0.0.12", userAgent: "Chrome" },
      createdAt: daysFromNow(-3),
      updatedAt: daysFromNow(-3),
    },
  ];
}

export function buildMockPublicCampaign(
  campaign: Campaign,
): PublicCampaignData {
  const stepThree =
    (campaign.content?.stepThree as Record<string, unknown> | undefined) ?? {};
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    clinicName: "Citybox Clínica",
    status: campaign.status,
    introText:
      (stepThree.introText as string | undefined) ??
      "Preencha o formulário abaixo para participar da campanha.",
    questions:
      (stepThree.questions as PublicCampaignData["questions"] | undefined) ?? [
        { id: "q-nome", type: "text", label: "Nome completo", required: true },
        { id: "q-tel", type: "phone", label: "WhatsApp", required: true },
      ],
    lgpdConsent:
      (stepThree.lgpdConsent as PublicCampaignData["lgpdConsent"] | undefined) ?? {
        text: "Autorizo o contato da clínica pelos dados informados.",
      },
    primaryColor: (stepThree.primaryColor as string | undefined) ?? "#2563eb",
    successAction: "message",
    successMessage: "Recebemos seus dados! Em breve entraremos em contato.",
    shouldSetCookie: true,
  };
}
