import type { FinancialEntry } from "./types";
import type {
  ExpenseCategory,
  FinancialAccount,
  IncomeCategory,
} from "./services/financial.service";

/**
 * Sementes em memória do Financeiro da vertical clínica.
 *
 * Clone da feature do OdontoTech rodando 100% mockada — nenhum dado vem de API.
 * As datas são relativas a "hoje" para o fluxo de caixa sempre ter conteúdo.
 */

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const MOCK_ACCOUNTS: FinancialAccount[] = [
  { id: "acc-1", name: "Caixa da Clínica", type: "cash", isActive: true, createdAt: isoDay(-320) },
  { id: "acc-2", name: "Conta Corrente Itaú", type: "checking", isActive: true, createdAt: isoDay(-300) },
  { id: "acc-3", name: "Conta Poupança", type: "savings", isActive: true, createdAt: isoDay(-200) },
  { id: "acc-4", name: "Caixa Antigo", type: "cash", isActive: false, createdAt: isoDay(-400) },
];

export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "exp-cat-1", name: "Aluguel", color: "#EF4444" },
  { id: "exp-cat-2", name: "Materiais", color: "#F97316" },
  { id: "exp-cat-3", name: "Salários", color: "#3B82F6" },
  { id: "exp-cat-4", name: "Marketing", color: "#A855F7" },
  { id: "exp-cat-5", name: "Manutenção", color: "#14B8A6" },
  { id: "exp-cat-6", name: "Impostos", color: "#6B7280" },
];

export const MOCK_INCOME_CATEGORIES: IncomeCategory[] = [
  { id: "inc-cat-1", name: "Consultas", color: "#22C55E" },
  { id: "inc-cat-2", name: "Procedimentos", color: "#3B82F6" },
  { id: "inc-cat-3", name: "Convênios", color: "#6366F1" },
  { id: "inc-cat-4", name: "Produtos", color: "#F59E0B" },
];

interface MockPatient {
  id: string;
  name: string;
  cpf: string | null;
}

const MOCK_PATIENTS: MockPatient[] = [
  { id: "pat-1", name: "Maria Oliveira", cpf: "12345678901" },
  { id: "pat-2", name: "João Santos", cpf: "23456789012" },
  { id: "pat-3", name: "Ana Costa", cpf: "34567890123" },
  { id: "pat-4", name: "Carlos Pereira", cpf: "45678901234" },
  { id: "pat-5", name: "Fernanda Lima", cpf: null },
];

const PAYMENT_METHODS = ["cash", "credit", "debit", "pix", "transfer", "boleto"];

function baseEntry(partial: Partial<FinancialEntry> & { id: string }): FinancialEntry {
  const dueDate = partial.dueDate ?? isoDay(0);
  const status = partial.status ?? "pending";
  const isOverdue =
    status === "pending" && dueDate < isoDay(0) ? true : partial.isOverdue ?? false;

  return {
    id: partial.id,
    type: partial.type ?? "income",
    status,
    origin: partial.origin ?? "manual",
    description: partial.description ?? "",
    value: partial.value ?? 0,
    dueDate,
    paidAt: partial.paidAt ?? null,
    paidValue: partial.paidValue ?? null,
    paymentMethod: partial.paymentMethod ?? null,
    paymentType: partial.paymentType ?? null,
    observation: partial.observation ?? null,
    hasReceipt: partial.hasReceipt ?? false,
    receiptUrl: partial.receiptUrl ?? null,
    isOverdue,
    installmentNumber: partial.installmentNumber ?? null,
    totalInstallments: partial.totalInstallments ?? null,
    recurrenceGroupId: partial.recurrenceGroupId ?? null,
    categoryId: partial.categoryId ?? null,
    category: partial.category ?? null,
    incomeCategoryId: partial.incomeCategoryId ?? null,
    incomeCategory: partial.incomeCategory ?? null,
    account: partial.account ?? null,
    patientId: partial.patientId ?? null,
    patient: partial.patient ?? null,
    budgetId: partial.budgetId ?? null,
    checkDate: partial.checkDate ?? null,
    checkName: partial.checkName ?? null,
    checkNumber: partial.checkNumber ?? null,
    checkBank: partial.checkBank ?? null,
    checkCpfCnpj: partial.checkCpfCnpj ?? null,
    createdAt: partial.createdAt ?? isoDay(-30),
  };
}

function expenseCategory(id: string) {
  const cat = MOCK_EXPENSE_CATEGORIES.find((c) => c.id === id);
  return cat ? { id: cat.id, name: cat.name, color: cat.color } : null;
}

function incomeCategory(id: string) {
  const cat = MOCK_INCOME_CATEGORIES.find((c) => c.id === id);
  return cat ? { id: cat.id, name: cat.name, color: cat.color } : null;
}

function account(id: string) {
  const acc = MOCK_ACCOUNTS.find((a) => a.id === id);
  return acc ? { id: acc.id, name: acc.name } : null;
}

function patient(id: string) {
  const pat = MOCK_PATIENTS.find((p) => p.id === id);
  return pat ? { id: pat.id, name: pat.name, cpf: pat.cpf } : null;
}

/** Constrói a lista inicial de lançamentos (recriada a cada carga do store). */
export function buildMockEntries(): FinancialEntry[] {
  const entries: FinancialEntry[] = [];

  // ---- Receitas de pacientes (pendentes / recebidas / vencidas) ---- //
  const incomeSeeds: Array<{
    day: number;
    value: number;
    patientId: string;
    incomeCategoryId: string;
    status: FinancialEntry["status"];
    method?: string;
    receipt?: boolean;
    installment?: [number, number];
  }> = [
    { day: -12, value: 350, patientId: "pat-1", incomeCategoryId: "inc-cat-1", status: "received", method: "pix" },
    { day: -8, value: 1200, patientId: "pat-2", incomeCategoryId: "inc-cat-2", status: "received", method: "credit" },
    { day: -5, value: 480, patientId: "pat-3", incomeCategoryId: "inc-cat-1", status: "pending", method: "boleto" },
    { day: -2, value: 900, patientId: "pat-4", incomeCategoryId: "inc-cat-2", status: "pending", method: "pix" },
    { day: 1, value: 250, patientId: "pat-5", incomeCategoryId: "inc-cat-1", status: "pending", method: "cash" },
    { day: 4, value: 2100, patientId: "pat-1", incomeCategoryId: "inc-cat-2", status: "pending", method: "boleto", installment: [1, 3] },
    { day: 6, value: 600, patientId: "pat-2", incomeCategoryId: "inc-cat-3", status: "pending", method: "pix" },
    { day: 9, value: 320, patientId: "pat-3", incomeCategoryId: "inc-cat-1", status: "pending", method: "cash" },
    { day: -20, value: 780, patientId: "pat-4", incomeCategoryId: "inc-cat-2", status: "received", method: "debit" },
    { day: -3, value: 150, patientId: "pat-5", incomeCategoryId: "inc-cat-4", status: "pending", method: "cash" },
    { day: 12, value: 1500, patientId: "pat-1", incomeCategoryId: "inc-cat-2", status: "pending", method: "credit" },
    { day: -15, value: 430, patientId: "pat-2", incomeCategoryId: "inc-cat-1", status: "received", method: "cash", receipt: true },
    { day: -7, value: 5200, patientId: "pat-1", incomeCategoryId: "inc-cat-2", status: "received", method: "cash" },
    { day: -9, value: 3800, patientId: "pat-3", incomeCategoryId: "inc-cat-1", status: "received", method: "cash" },
    { day: -11, value: 2070, patientId: "pat-4", incomeCategoryId: "inc-cat-2", status: "received", method: "cash" },
    { day: -14, value: 980, patientId: "pat-5", incomeCategoryId: "inc-cat-4", status: "received", method: "boleto" },
  ];

  incomeSeeds.forEach((seed, index) => {
    const isReceived = seed.status === "received";
    entries.push(
      baseEntry({
        id: `entry-income-${index + 1}`,
        type: "income",
        status: seed.status,
        description: `Atendimento ${MOCK_INCOME_CATEGORIES.find((c) => c.id === seed.incomeCategoryId)?.name}`,
        value: seed.value,
        dueDate: isoDay(seed.day),
        paidAt: isReceived ? isoDay(seed.day) : null,
        paidValue: isReceived ? seed.value : null,
        paymentMethod: seed.method ?? (isReceived ? "pix" : null),
        hasReceipt: seed.receipt ?? false,
        receiptUrl: seed.receipt ? "https://picsum.photos/seed/receipt/600/800" : null,
        installmentNumber: seed.installment?.[0] ?? null,
        totalInstallments: seed.installment?.[1] ?? null,
        recurrenceGroupId: seed.installment ? "rec-income-1" : null,
        incomeCategoryId: seed.incomeCategoryId,
        incomeCategory: incomeCategory(seed.incomeCategoryId),
        account: isReceived ? account("acc-1") : account("acc-1"),
        patientId: seed.patientId,
        patient: patient(seed.patientId),
        createdAt: isoDay(seed.day - 10),
      }),
    );
  });

  // ---- Despesas (pendentes / pagas / vencidas) ---- //
  const expenseSeeds: Array<{
    day: number;
    value: number;
    description: string;
    categoryId: string;
    status: FinancialEntry["status"];
    method?: string;
    receipt?: boolean;
    recurrence?: [number, number, string];
  }> = [
    { day: -25, value: 4500, description: "Aluguel do consultório", categoryId: "exp-cat-1", status: "paid", method: "transfer", recurrence: [1, 12, "rec-expense-rent"] },
    { day: 5, value: 4500, description: "Aluguel do consultório", categoryId: "exp-cat-1", status: "pending", method: "transfer", recurrence: [2, 12, "rec-expense-rent"] },
    { day: -10, value: 890, description: "Compra de materiais odontológicos", categoryId: "exp-cat-2", status: "paid", method: "credit", receipt: true },
    { day: -4, value: 320, description: "Manutenção do compressor", categoryId: "exp-cat-5", status: "pending", method: "pix" },
    { day: -1, value: 12000, description: "Folha de pagamento", categoryId: "exp-cat-3", status: "pending", method: "transfer" },
    { day: 3, value: 750, description: "Campanha de marketing digital", categoryId: "exp-cat-4", status: "pending", method: "boleto" },
    { day: 8, value: 1600, description: "Impostos do mês", categoryId: "exp-cat-6", status: "pending", method: "boleto" },
    { day: -18, value: 540, description: "Reposição de EPIs", categoryId: "exp-cat-2", status: "paid", method: "pix" },
    { day: -6, value: 210, description: "Conta de energia", categoryId: "exp-cat-5", status: "pending", method: "pix" },
    { day: 11, value: 980, description: "Materiais de escritório", categoryId: "exp-cat-2", status: "pending", method: "cash" },
    { day: -13, value: 1500, description: "Compra de insumos (dinheiro)", categoryId: "exp-cat-2", status: "paid", method: "cash" },
    { day: -16, value: 1000, description: "Taxa cartório / boletos", categoryId: "exp-cat-6", status: "paid", method: "boleto" },
  ];

  expenseSeeds.forEach((seed, index) => {
    const isPaid = seed.status === "paid";
    entries.push(
      baseEntry({
        id: `entry-expense-${index + 1}`,
        type: "expense",
        status: seed.status,
        description: seed.description,
        value: seed.value,
        dueDate: isoDay(seed.day),
        paidAt: isPaid ? isoDay(seed.day) : null,
        paidValue: isPaid ? seed.value : null,
        paymentMethod: seed.method ?? (isPaid ? "transfer" : null),
        hasReceipt: seed.receipt ?? false,
        receiptUrl: seed.receipt ? "https://picsum.photos/seed/expense/600/800" : null,
        installmentNumber: seed.recurrence?.[0] ?? null,
        totalInstallments: seed.recurrence?.[1] ?? null,
        recurrenceGroupId: seed.recurrence?.[2] ?? null,
        categoryId: seed.categoryId,
        category: expenseCategory(seed.categoryId),
        account: isPaid ? account("acc-2") : account("acc-2"),
        createdAt: isoDay(seed.day - 5),
      }),
    );
  });

  return entries;
}

export { MOCK_PATIENTS, PAYMENT_METHODS };
