export type PipelineStatus = "active" | "archived";
export type PipelineStageType = "open" | "won" | "lost";
export type PipelineTemplateId = "blank" | "vendas";

export type PipelineStageItem = {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  probability: number;
  stageType: PipelineStageType;
  isSystem: boolean;
  sortOrder: number;
  dealCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PipelineItem = {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  status: PipelineStatus;
  stages: PipelineStageItem[];
  createdAt: string;
  updatedAt: string;
};
