import type {
  AnamnesisTemplateStatus,
  TemplateAggregate,
} from '../application/dtos/anamnesis.dto';
import { AnamnesisTemplateRepository } from '../domain/repositories/anamnesis.repository.interface';

export class InMemoryAnamnesisTemplateRepository extends AnamnesisTemplateRepository {
  private templates: TemplateAggregate[] = [];

  findAllAggregates(storeId: string): Promise<TemplateAggregate[]> {
    return Promise.resolve(
      this.templates
        .filter((template) => template.storeId === storeId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((template) => this.clone(template)),
    );
  }

  findAggregateById(
    storeId: string,
    id: string,
  ): Promise<TemplateAggregate | null> {
    const template = this.templates.find(
      (item) => item.id === id && item.storeId === storeId,
    );
    return Promise.resolve(template ? this.clone(template) : null);
  }

  findByName(storeId: string, name: string): Promise<TemplateAggregate | null> {
    const lower = name.toLowerCase();
    const template = this.templates.find(
      (item) => item.storeId === storeId && item.name.toLowerCase() === lower,
    );
    return Promise.resolve(template ? this.clone(template) : null);
  }

  saveAggregate(aggregate: TemplateAggregate): Promise<TemplateAggregate> {
    const index = this.templates.findIndex((item) => item.id === aggregate.id);
    const saved = this.clone(aggregate);
    if (index >= 0) {
      this.templates[index] = saved;
    } else {
      this.templates.push(saved);
    }
    return Promise.resolve(this.clone(saved));
  }

  updateStatus(
    storeId: string,
    id: string,
    status: AnamnesisTemplateStatus,
  ): Promise<TemplateAggregate> {
    const template = this.templates.find(
      (item) => item.id === id && item.storeId === storeId,
    );
    if (!template) {
      return Promise.reject(new Error('Template not found'));
    }
    const updated: TemplateAggregate = {
      ...this.clone(template),
      status,
      updatedAt: new Date(),
    };
    return this.saveAggregate(updated);
  }

  delete(storeId: string, id: string): Promise<void> {
    this.templates = this.templates.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
    return Promise.resolve();
  }

  patientAnamnesisCounts = new Map<string, number>();

  countPatientAnamneses(_storeId: string, templateId: string): Promise<number> {
    return Promise.resolve(this.patientAnamnesisCounts.get(templateId) ?? 0);
  }

  getAll(): TemplateAggregate[] {
    return this.templates.map((template) => this.clone(template));
  }

  clear(): void {
    this.templates = [];
  }

  private clone(template: TemplateAggregate): TemplateAggregate {
    return {
      ...template,
      templateQuestions: template.templateQuestions.map((item) => ({
        ...item,
      })),
      customQuestions: template.customQuestions.map((item) => ({ ...item })),
    };
  }
}
