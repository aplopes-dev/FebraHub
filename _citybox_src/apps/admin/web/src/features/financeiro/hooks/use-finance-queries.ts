import { useQuery } from '@tanstack/react-query';
import { fetchBillingKpis, fetchInvoices, fetchInvoicesStats, fetchSubscriptions, fetchGatewayEvents, fetchGatewayStats } from '@/lib/admin-api';
import type { InvoiceDto, WebhookEventDto } from '@/lib/admin-api';
import type { Invoice, Subscription, BillingKpis, InvoiceStatus, PaymentMethod, DefaulterEntry, RevenueDataPoint, WebhookLog } from '../types';

export const financeKeys = {
  all: ['finance'] as const,
  kpis: (params?: Record<string, any>) => [...financeKeys.all, 'kpis', params] as const,
  invoices: (params: Record<string, any>) => [...financeKeys.all, 'invoices', params] as const,
  subscriptions: (params: Record<string, any>) => [...financeKeys.all, 'subscriptions', params] as const,
};

export function useBillingKpis(params: { startDate?: string; endDate?: string; enabled?: boolean } = {}) {
  const { enabled, ...queryKeyParams } = params;
  return useQuery<BillingKpis>({
    queryKey: financeKeys.kpis(queryKeyParams),
    enabled: enabled !== false,
    queryFn: async () => {
      const res = await fetchBillingKpis(queryKeyParams);
      
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const topDefaulters: DefaulterEntry[] = (res.topDefaulters ?? []).map((d) => ({
        clientId: d.clientId,
        clientName: d.clientName,
        amount: d.amountCents / 100,
        daysOverdue: d.daysOverdue,
      }));

      const revenueHistory: RevenueDataPoint[] = (res.revenueHistory ?? []).map((d) => {
        const [year, monthStr] = d.month.split("-");
        const monthIdx = parseInt(monthStr, 10) - 1;
        const formattedMonth = `${months[monthIdx]}/${year.slice(-2)}`;
        return {
          month: formattedMonth,
          prevista: d.expectedCents / 100,
          realizada: d.realizedCents / 100,
        };
      });

      return {
        mrrCents: res.mrrCents,
        mrrChurnedCents: res.mrrChurnedCents,
        pastDueAmountCents: res.pastDueAmountCents,
        inadimplenciaRate: res.inadimplenciaRate,
        openAmountNext30DaysCents: res.openAmountNext30DaysCents,
        currentMonthExpectedReceiptsCents: res.currentMonthExpectedReceiptsCents,
        currentMonthReceivedReceiptsCents: res.currentMonthReceivedReceiptsCents,
        currentMonthTotalInvoicesCount: res.currentMonthTotalInvoicesCount,
        currentMonthOnTimeInvoicesCount: res.currentMonthOnTimeInvoicesCount,
        topDefaulters,
        revenueHistory,
      };
    },
  });
}

export function useFinanceInvoices(params: {
  page?: number;
  perPage?: number;
  status?: string[];
  method?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
} = {}) {
  const { enabled, ...queryKeyParams } = params;
  return useQuery({
    queryKey: financeKeys.invoices(queryKeyParams),
    enabled: enabled !== false,
    queryFn: async () => {
      const invoicesRes = await fetchInvoices({
        page: queryKeyParams.page,
        perPage: queryKeyParams.perPage,
        status: queryKeyParams.status,
        method: queryKeyParams.method,
        search: queryKeyParams.search,
        dueDateFrom: queryKeyParams.startDate,
        dueDateTo: queryKeyParams.endDate,
      });

      const data: Invoice[] = invoicesRes.data.map((inv: InvoiceDto) => {
        let mappedStatus: InvoiceStatus = "OPEN";
        if (inv.status === "PAID") mappedStatus = "PAID";
        if (inv.status === "PAST_DUE") mappedStatus = "PAST_DUE";
        if (inv.status === "VOID") mappedStatus = "VOID";
        if (inv.status === "DRAFT") mappedStatus = "DRAFT";

        let mappedMethod: PaymentMethod = "UNDEFINED";
        if (inv.method === "PIX" || inv.method === "pix") mappedMethod = "PIX";
        if (inv.method === "CREDIT_CARD" || inv.method === "cartao" || inv.method === "credit_card") mappedMethod = "CREDIT_CARD";
        if (inv.method === "BOLETO" || inv.method === "boleto") mappedMethod = "BOLETO";

        const periodStart = inv.periodStart ? new Date(inv.periodStart) : new Date();
        const year = periodStart.getFullYear();
        const month = String(periodStart.getMonth() + 1).padStart(2, "0");
        const ref = `${year}-${month}`;

        return {
          id: inv.id,
          ref,
          clientId: inv.clientId,
          clientName: inv.clientName ?? "Cliente Desconhecido",
          clientDocument: inv.clientDocument ?? "",
          whatsapp: inv.clientWhatsapp ?? undefined,
          amountCents: inv.amountCents,
          currency: inv.currency ?? "BRL",
          status: mappedStatus,
          dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
          paidAt: inv.paidAt ?? null,
          method: mappedMethod,
          gatewayPaymentId: inv.gatewayPaymentId ?? null,
          invoiceUrl: inv.invoiceUrl ?? null,
          notes: inv.notes ?? null,
          periodStart: inv.periodStart ?? "",
          periodEnd: inv.periodEnd ?? "",
        };
      });

      return {
        data,
        meta: invoicesRes.meta,
      };
    },
  });
}

export function useFinanceInvoicesStats(params: {
  status?: string[];
  method?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
} = {}) {
  const { enabled, ...queryKeyParams } = params;
  return useQuery({
    queryKey: [...financeKeys.all, 'invoices-stats', queryKeyParams],
    enabled: enabled !== false,
    queryFn: async () => {
      const res = await fetchInvoicesStats({
        status: queryKeyParams.status,
        method: queryKeyParams.method,
        search: queryKeyParams.search,
        dueDateFrom: queryKeyParams.startDate,
        dueDateTo: queryKeyParams.endDate,
      });
      return res;
    },
  });
}

export function useFinanceSubscriptions(params: {
  page?: number;
  perPage?: number;
  status?: string[];
} = {}) {
  return useQuery({
    queryKey: financeKeys.subscriptions(params),
    queryFn: async () => {
      const subsRes = await fetchSubscriptions(params);

      const data: Subscription[] = subsRes.data.map((sub: any) => {
        let mappedStatus: "ativo" | "atrasado" | "cancelado" = "ativo";
        if (sub.status === "PAST_DUE") mappedStatus = "atrasado";
        if (sub.status === "CANCELED") mappedStatus = "cancelado";

        let mappedCycle: "mensal" | "anual" = "mensal";
        if (sub.cycle === "YEARLY") mappedCycle = "anual";

        const priceCents = sub.priceCents ?? 0;
        const mrr = mappedCycle === "anual" ? Math.round(priceCents / 12) : priceCents;

        return {
          id: sub.id,
          clientId: sub.clientId,
          clientName: sub.clientName ?? "Cliente Desconhecido",
          plan: (sub.planName || "Sem plano").toLowerCase() as any,
          cycle: mappedCycle,
          mrr,
          nextRenewal: sub.currentPeriodEnd ? sub.currentPeriodEnd.split("T")[0] : "",
          status: mappedStatus,
        };
      });

      return {
        data,
        meta: subsRes.meta,
      };
    },
  });
}

export function useGatewayEvents(params: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: ['finance', 'gateway-events', params],
    queryFn: async () => {
      const res = await fetchGatewayEvents(params);

      const data: WebhookLog[] = res.data.map((dto: WebhookEventDto) => {
        let localStatus: "processado" | "ignorado" | "erro" = "ignorado";
        if (dto.status === "PROCESSED") localStatus = "processado";
        if (dto.status === "FAILED") localStatus = "erro";

        let invoiceId = "-";
        if (dto.payload?.payment?.invoiceNumber) {
          invoiceId = `#${dto.payload.payment.invoiceNumber}`;
        } else if (dto.payload?.payment?.id) {
          invoiceId = dto.payload.payment.id;
        } else if (dto.payload?.subscription?.id) {
          invoiceId = dto.payload.subscription.id;
        } else if (dto.payload?.id) {
          invoiceId = dto.payload.id;
        }

        let gatewayResponse = dto.errorMessage ?? "Sucesso";
        if (dto.status === "PROCESSED") {
          const billingType = dto.payload?.payment?.billingType || dto.payload?.subscription?.billingType;
          gatewayResponse = billingType ? `Aprovado (${billingType})` : "Processado";
        } else if (dto.status === "FAILED") {
          gatewayResponse = dto.errorMessage || "Erro no processamento";
        } else {
          gatewayResponse = "Aguardando";
        }

        const description = dto.payload?.description || dto.payload?.payment?.description || dto.payload?.subscription?.description || "";

        return {
          id: dto.id,
          timestamp: dto.createdAt,
          event: dto.eventType,
          invoiceId,
          description,
          clientName: dto.clientName ?? "Cliente Desconhecido",
          clientId: dto.clientId ?? undefined,
          gatewayResponse,
          localStatus,
          payload: dto.payload,
        };
      });

      return {
        data,
        meta: res.meta,
      };
    },
  });
}

export function useGatewayStats() {
  return useQuery({
    queryKey: ['finance', 'gateway-stats'],
    queryFn: async () => {
      const res = await fetchGatewayStats();

      const processedCount = res.processedCount;
      const failedCount = res.failedCount;
      const totalCount = res.totalCount;

      let lastMinutes: number | null = null;
      if (res.lastEventCreatedAt) {
        const diffMs = Date.now() - new Date(res.lastEventCreatedAt).getTime();
        lastMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      }

      const kpis = [
        {
          label: "Processados",
          value: String(processedCount),
          trend: 0,
        },
        {
          label: "Com Erro",
          value: String(failedCount),
          trend: 0,
          trendInverted: true,
        },
        {
          label: "Ignorados",
          value: String(res.pendingCount),
          trend: 0,
          trendInverted: true,
        },
        {
          label: "Taxa de Sucesso",
          value: totalCount > 0 ? `${Math.round((processedCount / totalCount) * 100)}%` : "0%",
          trend: 0,
        },
      ];

      return {
        totalEvents: totalCount,
        lastMinutes,
        kpis,
      };
    },
  });
}
