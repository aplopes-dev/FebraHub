import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';

const DEFAULT_ACCOUNTS = [
  { name: 'Caixa', type: 'cash' },
  { name: 'Conta Corrente', type: 'checking' },
] as const;

const EXPENSE_CATEGORIES = [
  { name: 'Custos fixos', color: '#F97316' },
  { name: 'Produtos / materiais', color: '#3B82F6' },
  { name: 'Encargos', color: '#EF4444' },
  { name: 'Outras despesas', color: '#A855F7' },
] as const;

const INCOME_CATEGORIES = [
  { name: 'Serviços', color: '#22C55E' },
  { name: 'Produtos', color: '#F59E0B' },
  { name: 'Outras receitas', color: '#6B7280' },
] as const;

const CLIENT_CATEGORIES = [
  { name: 'VIP', colorId: '#EAB308', isProtected: false },
  { name: 'Frequente', colorId: '#3B82F6', isProtected: false },
  { name: 'Novo', colorId: '#10B981', isProtected: false },
  { name: 'Geral', colorId: '#6B7280', isProtected: true },
] as const;

const APPOINTMENT_CATEGORIES = [
  { name: 'Estética', color: '#8B5CF6' },
  { name: 'Geral', color: '#3B82F6' },
] as const;

/** Seed de contas, categorias financeiras, clientes e agendamentos no provisionamento da loja (idempotente). */
@Injectable()
export class SeedFinancialDefaultsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(storeId: string): Promise<void> {
    // 1. Contas financeiras
    for (const account of DEFAULT_ACCOUNTS) {
      const existingAccount = await this.prisma.financialAccount.findFirst({
        where: { storeId, name: account.name },
      });
      if (!existingAccount) {
        await this.prisma.financialAccount.create({
          data: {
            storeId,
            name: account.name,
            type: account.type,
            isActive: true,
          },
        });
      }
    }

    // 2. Categorias de Despesa e Receita
    for (const category of EXPENSE_CATEGORIES) {
      await this.ensureCategory(storeId, 'expense', category);
    }
    for (const category of INCOME_CATEGORIES) {
      await this.ensureCategory(storeId, 'income', category);
    }

    // 3. Categorias de Clientes
    for (const cat of CLIENT_CATEGORIES) {
      const existingClientCat = await this.prisma.clientCategory.findFirst({
        where: { storeId, name: cat.name },
      });
      if (!existingClientCat) {
        await this.prisma.clientCategory.create({
          data: {
            storeId,
            name: cat.name,
            colorId: cat.colorId,
            isProtected: cat.isProtected,
          },
        });
      }
    }

    // 4. Categorias de Agendamentos
    for (const cat of APPOINTMENT_CATEGORIES) {
      const existingApptCat = await this.prisma.appointmentCategory.findFirst({
        where: { storeId, name: cat.name },
      });
      if (!existingApptCat) {
        await this.prisma.appointmentCategory.create({
          data: {
            storeId,
            name: cat.name,
            color: cat.color,
          },
        });
      }
    }
  }

  private async ensureCategory(
    storeId: string,
    kind: 'income' | 'expense',
    category: { name: string; color: string },
  ): Promise<void> {
    const existing = await this.prisma.financialCategory.findFirst({
      where: { storeId, kind, name: category.name },
    });
    if (!existing) {
      await this.prisma.financialCategory.create({
        data: {
          storeId,
          kind,
          name: category.name,
          color: category.color,
        },
      });
      return;
    }
    if (!existing.color.trim()) {
      await this.prisma.financialCategory.update({
        where: { id: existing.id },
        data: { color: category.color },
      });
    }
  }
}
