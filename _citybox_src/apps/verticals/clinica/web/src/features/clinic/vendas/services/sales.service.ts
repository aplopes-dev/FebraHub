/**
 * Service de Vendas (CRM) — tipagem + implementação via clinica-api.
 * Mock em memória removido na integração (jul/2026).
 */
export type {
  FunnelStage,
  FunnelStageFull,
  Funnel,
  CreateFunnelData,
  UpdateFunnelData,
  Opportunity,
  CreateOpportunityData,
  UpdateOpportunityData,
  ListOpportunitiesFilters,
  Label,
  CreateLabelData,
  UpdateLabelData,
  HistoryEntry,
} from "./sales.types";

export { salesService, labelService } from "./sales.api.service";
