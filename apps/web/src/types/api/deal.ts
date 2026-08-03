import type { Task } from "./task";

export type DealStageType = "open" | "won" | "lost";

export type { Task as DealTask, TaskPriority as DealTaskPriority } from "./task";

export type DealActivityType =
  | "nota"
  | "ligacao"
  | "email"
  | "whatsapp"
  | "estagio"
  | "tarefa"
  | "criado"
  | "atualizado";

export type DealActivity = {
  id: string;
  type: DealActivityType;
  text: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
};

export type DealFile = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string | null;
  sizeBytes: number;
  storageKey: string;
  url: string;
  uploadedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DealProductItem = {
  productId: string;
  productName: string;
  productColor: string;
  valueCents: number;
  sortOrder: number;
  planId?: string | null;
};

export type DealItem = {
  id: string;
  organizationId: string;
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  stageType: DealStageType;
  stageColor: string;
  probability: number;
  customerId: string;
  customerName: string;
  customerLogoUrl: string | null;
  contactId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  products: DealProductItem[];
  /** Primeiro produto (compat). Preferir `products`. */
  productId: string | null;
  productName: string | null;
  productColor: string | null;
  ownerUserId: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  title: string;
  valueCents: number;
  lastActivityAt: string;
  closedAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  nextTask: { title: string; dueAt: string } | null;
};

export type DealDetail = DealItem & {
  activities: DealActivity[];
  tasks: Task[];
  files: DealFile[];
};

export type CreateDealProductInput = {
  productId: string;
  valueCents?: number;
  planId?: string | null;
};

export type CreateDealInput = {
  pipelineId: string;
  stageId: string;
  customerId: string;
  contactId?: string;
  productId?: string;
  products?: CreateDealProductInput[];
  valueCents?: number;
  title?: string;
  ownerUserId?: string;
};

export type UpdateDealInput = {
  title?: string;
  valueCents?: number;
  contactId?: string | null;
  productId?: string | null;
  products?: CreateDealProductInput[];
  ownerUserId?: string;
};

export type MoveDealStageInput = {
  stageId: string;
  lostReason?: string;
};

export type AddDealActivityInput = {
  text: string;
};

export type DownloadDealFileResult = {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
  mimeType: string | null;
};
