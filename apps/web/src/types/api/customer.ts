export type CustomerPersonType = "pj" | "pf";
export type CustomerLifecycleStage =
  | "lead"
  | "opportunity"
  | "active_customer"
  | "inactive"
  | "lost";
export type CustomerHealth = "saudavel" | "atencao" | "risco";
export type CustomerOnboardingRisk = "ok" | "atrasado" | "bloqueado";
export type CustomerTicketStatus = "aberto" | "andamento" | "resolvido";
export type CustomerTicketPriority = "alta" | "media" | "baixa";
export type CustomerListTab = "all" | "risk";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CustomerListItem = {
  id: string;
  name: string;
  personType: CustomerPersonType;
  lifecycleStage: CustomerLifecycleStage;
  document: string | null;
  segment: string;
  color: string;
  iconKey: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  products: string[];
  mrrCents: number;
  healthScore: number;
  health: CustomerHealth;
  nextRenewalAt: string | null;
  csmName: string;
  createdAt: string;
};

export type CustomerContactListItem = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  customerId: string;
  customerName: string;
};

export type CustomerContact = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
};

export type CustomerProduct = {
  id: string;
  productId: string | null;
  productName: string;
  plan: string;
  monthlyValueCents: number;
  contractedAt: string;
};

export type CustomerOnboarding = {
  phase: string;
  progress: number;
  risk: CustomerOnboardingRisk;
  startedAt: string;
  responsibleName: string;
};

export type CustomerTicket = {
  id: string;
  subject: string;
  description: string;
  status: CustomerTicketStatus;
  priority: CustomerTicketPriority;
  assigneeUserId: string | null;
  assigneeName: string | null;
  openedAt: string;
  resolvedAt: string | null;
};

export type CustomerNpsResponse = {
  id: string;
  score: number;
  comment: string;
  respondentContactName: string;
  respondedAt: string;
};

export type CustomerFileKind = "file" | "folder";

export type CustomerFile = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType?: string | null;
  sizeBytes: number;
  url: string;
  kind: CustomerFileKind;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerFileBreadcrumb = {
  id: string;
  fileName: string;
};

export type CustomerFilesFolderResponse = {
  items: CustomerFile[];
  breadcrumb: CustomerFileBreadcrumb[];
  parentId: string | null;
};

export type CustomerActivity = {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
};

export type CustomerSummary = {
  mrrCents: number;
  nextRenewalAt: string | null;
  healthScore: number;
  openDealsCount: number;
  openPipelineCents: number;
  wonRevenueCents: number;
};

export type CustomerDetail = {
  id: string;
  name: string;
  personType: CustomerPersonType;
  lifecycleStage: CustomerLifecycleStage;
  document: string | null;
  segment: string;
  color: string;
  iconKey: string;
  logoUrl: string | null;
  site: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  zipCode: string | null;
  complement: string | null;
  csmName: string;
  plan: string;
  mrrCents: number;
  healthScore: number;
  health: CustomerHealth;
  nextRenewalAt: string | null;
  customerSince: string;
  summary: CustomerSummary;
  contacts: CustomerContact[];
  products: CustomerProduct[];
  onboarding: CustomerOnboarding | null;
  tickets: CustomerTicket[];
  npsResponses: CustomerNpsResponse[];
  files: CustomerFile[];
  activities: CustomerActivity[];
};

export type CreateCustomerResponse = {
  id: string;
  name: string;
  personType: CustomerPersonType;
  lifecycleStage: CustomerLifecycleStage;
  document: string | null;
  segment: string;
  color: string;
  iconKey: string;
  csmName: string;
  plan: string;
  mrrCents: number;
  healthScore: number;
  health: CustomerHealth;
  nextRenewalAt: string | null;
  customerSince: string;
};

export type PrimaryContactInput = {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type AddCustomerContactInput = {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type CreateCustomerInput = {
  name: string;
  personType: CustomerPersonType;
  lifecycleStage?: CustomerLifecycleStage;
  document?: string;
  segment?: string;
  site?: string;
  instagram?: string;
  phone: string;
  email?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  complement?: string;
  primaryContact?: PrimaryContactInput;
};

export type UpdateCustomerInput = Partial<{
  name: string;
  personType: CustomerPersonType;
  lifecycleStage: CustomerLifecycleStage;
  document: string;
  site: string;
  instagram: string;
  phone: string;
  email: string;
  street: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  complement: string;
  segment: string;
  primaryContact: PrimaryContactInput;
}>;

export const CUSTOMER_HEALTH_LABEL: Record<CustomerHealth, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  risco: "Risco",
};

export const CUSTOMER_LIFECYCLE_STAGE_LABEL: Record<
  CustomerLifecycleStage,
  string
> = {
  lead: "Lead",
  opportunity: "Oportunidade",
  active_customer: "Cliente ativo",
  inactive: "Inativo",
  lost: "Perdido",
};

export const CUSTOMER_LIFECYCLE_STAGES = [
  "lead",
  "opportunity",
  "active_customer",
  "inactive",
  "lost",
] as const satisfies readonly CustomerLifecycleStage[];

export function healthColor(
  health: CustomerHealth,
): "success" | "warning" | "error" {
  if (health === "saudavel") return "success";
  if (health === "atencao") return "warning";
  return "error";
}

export function lifecycleStageColor(
  stage: CustomerLifecycleStage,
): "default" | "info" | "warning" | "success" | "error" {
  if (stage === "lead") return "info";
  if (stage === "opportunity") return "warning";
  if (stage === "active_customer") return "success";
  if (stage === "inactive") return "default";
  return "error";
}
