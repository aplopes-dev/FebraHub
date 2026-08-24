import type { SelectedCampaignType, CampaignStrategy } from "../types";
import type { PageStrategyFormData } from "../components/campaign-templates/page-template/step-two/page-template-step-two.schema";
import type { PageStrategyStepThreeFormData } from "../components/campaign-templates/page-template/step-three/page-template-step-three.schema";
import type { PageStrategyStepFourFormData } from "../components/campaign-templates/page-template/step-four/page-template-step-four.schema";
import type {
  AniversarioStepFourFormData,
  AniversarioStepTwoFormData,
} from "../components/campaign-templates/broadcast-template/aniversario/aniversario-form.schema";
import type { CreateCampaignData } from "../campaign.model";
import { toAbsoluteExternalUrl } from "./to-absolute-external-url";

/**
 * Mapeia os IDs do frontend para os valores do backend
 */
const SEGMENT_MAP: Record<string, string> = {
  "captacao-leads": "captacao_leads",
  "operacional-atendimento": "operacional_atendimento",
  "relacionamento-pos-venda": "relacionamento_pos_venda",
};

const TYPE_MAP: Record<string, string> = {
  "form-lead": "form_lead",
  mgm: "mgm",
  "debito-atraso": "debito_atraso",
  "retorno-tratamento": "retorno_tratamento",
  aniversario: "aniversario",
  nps: "nps",
};


/**
 * Determina o canal baseado na estratégia
 */
function getChannelFromStrategy(
  strategy: CampaignStrategy,
): "web" | "whatsapp" | "sms" {
  // Para estratégia PAGE, sempre usar web
  if (strategy === "PAGE") {
    return "web";
  }
  // Para outras estratégias, usar whatsapp como padrão
  // (pode ser ajustado no futuro se houver seleção de canal no formulário)
  return "whatsapp";
}

/**
 * Converte valores "none" ou strings vazias para undefined
 */
function cleanOptionalValue(
  value: string | undefined | null,
): string | undefined {
  if (!value || value === "none") {
    return undefined;
  }
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

/**
 * Remove campos undefined, null ou vazios de um objeto
 */
function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        // Incluir arrays mesmo se vazios, mas limpar strings vazias dentro
        cleaned[key as keyof T] = value as T[keyof T];
      } else if (typeof value === "string" && value.trim() === "") {
        // Pular strings vazias
        continue;
      } else {
        cleaned[key as keyof T] = value as T[keyof T];
      }
    }
  }
  return cleaned;
}

/**
 * Transforma os dados do formulário multi-step em formato do backend
 */
export function mapFormDataToCreateCampaign(
  selectedCampaignType: SelectedCampaignType,
  campaignStrategy: CampaignStrategy,
  pageStrategyData?: Partial<PageStrategyFormData>,
  pageStrategyStepThreeData?: Partial<PageStrategyStepThreeFormData>,
  pageStrategyStepFourData?: Partial<PageStrategyStepFourFormData>,
): CreateCampaignData {
  // Mapear segment e type
  const segment = SEGMENT_MAP[
    selectedCampaignType.segmentId
  ] as CreateCampaignData["segment"];
  const type = TYPE_MAP[
    selectedCampaignType.typeId
  ] as CreateCampaignData["type"];

  if (!segment || !type) {
    throw new Error("Segmento ou tipo de campanha inválido");
  }

  // Mapear dados do step 2 (identificação e configurações básicas)
  const name = pageStrategyData?.name || "";
  // Limpar valores "none" e strings vazias
  const funnelId = cleanOptionalValue(pageStrategyData?.funnelId);
  const stageId = cleanOptionalValue(pageStrategyData?.stageId);

  // Mapear dados do step 4 (status e período)
  const statusType = pageStrategyStepFourData?.statusType as
    | CreateCampaignData["statusType"]
    | undefined;
  const endDate = pageStrategyStepFourData?.endDate || undefined;
  const leadLimit = pageStrategyStepFourData?.leadLimit || undefined;

  // Construir objeto content com dados do step 3 (formulário)
  const content: Record<string, unknown> = {};

  if (pageStrategyStepThreeData) {
    // Adicionar dados do formulário, removendo campos vazios
    const stepThreeData: Record<string, unknown> = {};

    if (pageStrategyStepThreeData.introText) {
      stepThreeData.introText = pageStrategyStepThreeData.introText;
    }
    if (pageStrategyStepThreeData.questions) {
      stepThreeData.questions = pageStrategyStepThreeData.questions;
    }
    if (pageStrategyStepThreeData.lgpdConsent) {
      const consent = pageStrategyStepThreeData.lgpdConsent;
      const cleanedPrivacyUrl = cleanOptionalValue(consent.privacyPolicyUrl);
      stepThreeData.lgpdConsent = {
        ...consent,
        ...(cleanedPrivacyUrl
          ? { privacyPolicyUrl: toAbsoluteExternalUrl(cleanedPrivacyUrl) }
          : {}),
      };
    }
    if (pageStrategyStepThreeData.primaryColor) {
      stepThreeData.primaryColor = pageStrategyStepThreeData.primaryColor;
    }
    if (pageStrategyStepThreeData.logoUrl) {
      stepThreeData.logoUrl = pageStrategyStepThreeData.logoUrl;
    }

    content.stepThree = stepThreeData;
  }

  // Adicionar dados do step 2 ao content, limpando valores inválidos
  if (pageStrategyData) {
    const stepTwoData: Record<string, unknown> = {
      name: pageStrategyData.name,
      notifyOnLead: pageStrategyData.notifyOnLead ?? false,
      duplicityRule: pageStrategyData.duplicityRule || "block",
      successAction: pageStrategyData.successAction || "message",
    };

    // Adicionar formDescription se existir
    if (pageStrategyData.formDescription) {
      stepTwoData.formDescription = pageStrategyData.formDescription;
    }

    // Adicionar campos opcionais apenas se tiverem valores válidos
    const cleanedFunnelId = cleanOptionalValue(pageStrategyData.funnelId);
    if (cleanedFunnelId) {
      stepTwoData.funnelId = cleanedFunnelId;
    }

    const cleanedStageId = cleanOptionalValue(pageStrategyData.stageId);
    if (cleanedStageId) {
      stepTwoData.stageId = cleanedStageId;
    }

    // ownerId: converter "none" para undefined
    const cleanedOwnerId = cleanOptionalValue(pageStrategyData.ownerId);
    if (cleanedOwnerId) {
      stepTwoData.ownerId = cleanedOwnerId;
    }

    if (
      pageStrategyData.notificationChannels &&
      pageStrategyData.notificationChannels.length > 0
    ) {
      stepTwoData.notificationChannels = pageStrategyData.notificationChannels;
    }

    if (pageStrategyData.tags && pageStrategyData.tags.length > 0) {
      stepTwoData.tags = pageStrategyData.tags;
    }

    const cleanedFbPixelId = cleanOptionalValue(pageStrategyData.fbPixelId);
    if (cleanedFbPixelId) {
      stepTwoData.fbPixelId = cleanedFbPixelId;
    }

    const cleanedGoogleTagId = cleanOptionalValue(pageStrategyData.googleTagId);
    if (cleanedGoogleTagId) {
      stepTwoData.googleTagId = cleanedGoogleTagId;
    }

    if (pageStrategyData.successMessage) {
      stepTwoData.successMessage = pageStrategyData.successMessage;
    }

    const cleanedRedirectUrl = cleanOptionalValue(pageStrategyData.redirectUrl);
    if (cleanedRedirectUrl) {
      stepTwoData.redirectUrl = toAbsoluteExternalUrl(cleanedRedirectUrl);
    }

    content.stepTwo = stepTwoData;
  }

  // Adicionar dados do step 4 ao content
  if (pageStrategyStepFourData) {
    const stepFourData: Record<string, unknown> = {
      statusType: pageStrategyStepFourData.statusType,
    };

    if (pageStrategyStepFourData.endDate) {
      stepFourData.endDate = pageStrategyStepFourData.endDate;
    }
    if (
      pageStrategyStepFourData.leadLimit !== undefined &&
      pageStrategyStepFourData.leadLimit !== null
    ) {
      stepFourData.leadLimit = pageStrategyStepFourData.leadLimit;
    }

    content.stepFour = stepFourData;
  }

  // Determinar canal baseado na estratégia
  const channel = getChannelFromStrategy(campaignStrategy);

  // Construir objeto final, removendo campos undefined
  const campaignData: CreateCampaignData = {
    name,
    segment,
    type,
    strategy: campaignStrategy,
    channel,
    content,
  };

  // Adicionar campos opcionais apenas se tiverem valores
  if (statusType) {
    campaignData.statusType = statusType;
  }
  if (endDate) {
    campaignData.endDate = endDate;
  }
  if (leadLimit !== undefined && leadLimit !== null) {
    campaignData.leadLimit = leadLimit;
  }
  if (funnelId) {
    campaignData.funnelId = funnelId;
  }
  if (stageId) {
    campaignData.stageId = stageId;
  }

  return campaignData;
}

export function mapAniversarioFormDataToCreateCampaign(
  selectedCampaignType: SelectedCampaignType,
  stepTwo: AniversarioStepTwoFormData,
  stepFour: AniversarioStepFourFormData,
): CreateCampaignData {
  const segment = SEGMENT_MAP[
    selectedCampaignType.segmentId
  ] as CreateCampaignData['segment'];
  const type = TYPE_MAP[
    selectedCampaignType.typeId
  ] as CreateCampaignData['type'];

  if (!segment || !type || type !== 'aniversario') {
    throw new Error('Segmento ou tipo de campanha inválido');
  }

  return {
    name: stepFour.name.trim(),
    segment,
    type,
    strategy: 'BROADCAST',
    channel: 'whatsapp',
    statusType: 'always_active',
    content: {
      planIds: stepTwo.planIds,
      specialtyIds: stepTwo.specialtyIds,
      genders: stepTwo.genders,
      messageBody: stepTwo.messageBody.trim(),
    },
  };
}
