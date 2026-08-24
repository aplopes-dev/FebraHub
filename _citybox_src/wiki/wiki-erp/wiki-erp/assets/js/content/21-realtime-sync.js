WIKI.register({
  id: 'realtime-sync',
  title: 'Realtime e Sync Offline',
  icon: '📡',
  searchText: 'realtime websocket rabbitmq sync offline push events pedidos KDS estoque notificacoes',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Devices e Realtime</div>
    <h1 class="section-title">📡 Realtime e Sync Offline</h1>
    <p class="section-subtitle">Infraestrutura de comunicação em tempo real — WebSocket gateway, push de eventos via RabbitMQ e sincronização de dados offline para o PDV.</p>
    <div class="section-tags">
      <span class="tag-orange">Realtime</span>
      <span class="tag-amber">WebSocket · RabbitMQ</span>
      <span class="tag-gray">Offline Sync</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>RabbitMQ configurado como event bus com outbox pattern</li>
      <li>Workers de projeção e outbox funcionais</li>
      <li>Realtime Gateway (<code>services/realtime-gw</code>) planejado mas não conectado ao ERP</li>
      <li>ERP não recebe push de eventos — precisa de polling manual</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>ERP conecta WebSocket ao realtime-gw na abertura do dashboard</li>
      <li>Novo pedido → push instantâneo ao ERP e KDS com alerta sonoro</li>
      <li>Mudança de status → atualização automática do Kanban</li>
      <li>Estoque reservado → badge de baixo estoque sem reload</li>
      <li>Reconexão automática com exponential backoff</li>
      <li>Sync offline: fila local IndexedDB/SQLite, drain ao reconectar</li>
    </ul>
  </div>

  <h2>Arquitetura realtime</h2>
  <div class="mermaid">
flowchart TB
  subgraph Backend
    CoreAPI["marketplace-api"]
    MQ["RabbitMQ"]
    RGW["realtime-gw\n(NestJS WS)"]
    Workers["Workers (outbox)"]
  end

  subgraph ERP_Browser ["ERP (browser)"]
    WS_Client["WebSocket Client"]
    Store["Zustand Store"]
    UI["React UI (Kanban, KDS)"]
  end

  subgraph PDV_Offline ["PDV Offline"]
    IDB["IndexedDB / SQLite"]
    SyncQueue["Sync Queue"]
  end

  CoreAPI -->|event| MQ
  MQ -->|consumer| Workers
  Workers -->|fan-out| RGW
  RGW -->|WS push| WS_Client
  WS_Client -->|dispatch| Store
  Store -->|re-render| UI

  PDV_Offline -->|online| SyncQueue
  SyncQueue -->|batch POST| CoreAPI
  </div>

  <h2>Eventos WebSocket por canal</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Dados</th><th>Destinatários</th></tr></thead>
      <tbody>
        <tr><td><code>order:new</code></td><td>orderId, channel, amount, items[]</td><td>ERP dashboard, KDS</td></tr>
        <tr><td><code>order:status</code></td><td>orderId, previousStatus, newStatus</td><td>ERP Kanban, app cliente</td></tr>
        <tr><td><code>order:ready</code></td><td>orderId, orderNumber</td><td>Display balcão, app cliente</td></tr>
        <tr><td><code>stock:low</code></td><td>itemId, itemName, quantity, minimum</td><td>ERP estoque</td></tr>
        <tr><td><code>stock:zero</code></td><td>itemId, itemName</td><td>ERP estoque, marketplace (unpublish)</td></tr>
        <tr><td><code>payment:confirmed</code></td><td>orderId, paymentId, method</td><td>PDV (liberar gaveta)</td></tr>
        <tr><td><code>device:offline</code></td><td>deviceId, deviceName</td><td>ERP devices</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Conexão WebSocket no ERP</h2>
  <pre>// apps/erp/src/lib/realtime.ts
import { io } from 'socket.io-client';

let socket: ReturnType&lt;typeof io&gt; | null = null;

export function connectRealtime(storeId: string, wsToken: string) {
  socket = io(process.env.NEXT_PUBLIC_REALTIME_URL!, {
    auth: { token: wsToken },
    query: { storeId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5
  });

  socket.on('order:new', (data) =&gt; {
    useOrderStore.getState().addOrder(data);
    playSound('new-order');
  });

  socket.on('order:status', (data) =&gt; {
    useOrderStore.getState().updateStatus(data.orderId, data.newStatus);
  });

  socket.on('stock:low', (data) =&gt; {
    useStockStore.getState().flagLow(data.itemId, data.quantity);
  });
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}</pre>

  <h2>Sync offline — estratégia</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">💾</span> Gravação local</div>
      <p>Toda transação offline gravada em IndexedDB com UUID local e timestamp. Marcada como <code>pending_sync</code>.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔄</span> Drain ao reconectar</div>
      <p>Service Worker detecta retorno de conectividade → drena fila em batch de 10 → confirma cada item processado.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚔️</span> Resolução de conflitos</div>
      <p>Conflito por timestamp: transação com createdAt mais recente vence. Conflitos de estoque: servidor é autoritário.</p>
    </div>
  </div>

  <h2>Service Worker de sync</h2>
  <pre>// apps/erp/src/sw/sync.ts
self.addEventListener('sync', async (event: SyncEvent) =&gt; {
  if (event.tag === 'pending-transactions') {
    const db = await openDB('erp-offline');
    const pending = await db.getAll('syncQueue');

    for (const tx of pending) {
      try {
        await fetch('/api/proxy/core/transactions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
        await db.delete('syncQueue', tx.id);
      } catch {
        break; // ainda offline, tentar depois
      }
    }
  }
});</pre>
</div>
`
});
