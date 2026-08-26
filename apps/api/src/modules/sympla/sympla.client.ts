/**
 * Cliente HTTP para a API pública da Sympla.
 * Base: https://api.sympla.com.br/public/v3
 * Auth: header s_token = SYMPLA_TOKEN
 */

const BASE = 'https://api.sympla.com.br/public/v3';

export interface SymplaEvento {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  published: number;
  cancelled: number;
  image: string;
  url: string;
  address: {
    name: string;
    city: string;
    state: string;
    address: string;
    address_num: string;
  };
}

export interface SymplaOrder {
  id: string;
  event_id: number;
  order_date: string;
  approved_date: string | null;
  updated_date: string;
  order_status: string;
  transaction_type: string;
  order_total_sale_price: number;
  order_total_net_value: number;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_email: string;
  invoice_info: {
    doc_type: string | null;
    doc_number: string | null;
    client_name: string | null;
  };
  utm: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
    referrer: string;
  };
}

export interface SymplaParticipante {
  id: number;
  event_id: number;
  order_id: string;
  order_status: string;
  order_date: string;
  ticket_number: string;
  ticket_name: string;
  ticket_sale_price: number;
  first_name: string;
  last_name: string;
  email: string;
  custom_form: Array<{ id: number; name: string; value: string }>;
  checkin: Array<{ checkin_id: number; check_in: boolean; check_in_date: string | null }>;
}

export interface SymplaPaginacao {
  has_next: boolean;
  has_prev: boolean;
  quantity: number;
  offset: number;
  page: number;
  page_size: number;
  total_page: number;
}

export class SymplaClient {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${BASE}${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), {
      headers: { s_token: this.token },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Sympla API ${path} → ${res.status}: ${txt}`);
    }
    return res.json() as Promise<T>;
  }

  /** Lista todos os eventos da conta (paginado). */
  async listarEventos(pagina = 1, tamanhoPagina = 50): Promise<{ data: SymplaEvento[]; pagination: SymplaPaginacao }> {
    return this.get('/events', { page: pagina, page_size: tamanhoPagina });
  }

  /** Lista pedidos de um evento específico. */
  async listarOrders(eventoId: number, pagina = 1, tamanhoPagina = 100): Promise<{ data: SymplaOrder[]; pagination: SymplaPaginacao }> {
    return this.get(`/events/${eventoId}/orders`, { page: pagina, page_size: tamanhoPagina });
  }

  /** Lista participantes de um pedido. */
  async listarParticipantes(eventoId: number, orderId: string, pagina = 1): Promise<{ data: SymplaParticipante[]; pagination: SymplaPaginacao }> {
    return this.get(`/events/${eventoId}/orders/${orderId}/participants`, { page: pagina, page_size: 100 });
  }

  /** Extrai CPF e telefone do formulário customizado do participante. */
  static extrairCampos(customForm: Array<{ name: string; value: string }>): { cpf?: string; telefone?: string } {
    let cpf: string | undefined;
    let telefone: string | undefined;
    for (const campo of customForm) {
      const nome = campo.name.toLowerCase();
      if (nome.includes('cpf')) {
        cpf = campo.value?.replace(/\D/g, '') || undefined;
      } else if (nome.includes('telefone') || nome.includes('celular') || nome.includes('whatsapp')) {
        telefone = campo.value?.replace(/\D/g, '') || undefined;
      }
    }
    return { cpf, telefone };
  }
}
