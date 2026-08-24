WIKI.register({
  id: 'roadmap-evolucao',
  title: 'Roadmap de Evolução',
  icon: '🗺️',
  searchText: 'roadmap evolucao fases MVP v1 v2 RICE prioridades PDV fiscal KDS analytics multi-vertical',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">🗺️ Roadmap de Evolução</h1>
    <p class="section-subtitle">Visão de fases de desenvolvimento do ERP Citybox Base — da consolidação do MVP até a plataforma multi-vertical completa, priorizando pelo framework RICE.</p>
    <div class="section-tags">
      <span class="tag-orange">Roadmap</span>
      <span class="tag-amber">RICE · Priorização</span>
      <span class="tag-gray">MVP → v1 → v2</span>
    </div>
  </div>

  <h2>Fases de desenvolvimento</h2>
  <div class="mermaid">
gantt
  title ERP Base — Roadmap de Entregas
  dateFormat  YYYY-MM
  section MVP (Consolidação)
    Auth + Shell multi-vertical    :done, 2026-01, 2026-03
    RBAC + Equipe (Food)           :done, 2026-02, 2026-04
    Catálogo CRUD completo         :active, 2026-05, 2026-07
    Pedidos Kanban realtime        :active, 2026-06, 2026-08
  section v1 (Operação)
    Dashboard operacional          :2026-07, 2026-08
    Configurações da loja          :2026-07, 2026-08
    Agenda / Slots (serviço)       :2026-07, 2026-10
    Clientes / CRM + fidelidade    :2026-08, 2026-10
    Notificações WhatsApp          :2026-08, 2026-10
    PDV offline-first              :2026-07, 2026-10
    Fiscal NFC-e / NF-e (PlugNotas):2026-07, 2026-10
    KDS + Devices pairing          :2026-08, 2026-10
    Estoque CRUD + alertas         :2026-07, 2026-09
  section v2 (Escala)
    Relatórios e Analytics         :2026-10, 2027-01
    Analytics vitrine marketplace  :2026-11, 2027-01
    Conciliação bancária OFX       :2026-11, 2027-02
    Vertical Market completa       :2026-12, 2027-03
  </div>

  <h2>Matriz RICE — Features prioritárias</h2>
  <div class="table-wrap rice-table">
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Reach</th>
          <th>Impact</th>
          <th>Confidence</th>
          <th>Effort (sem)</th>
          <th class="rice-score">RICE</th>
          <th>Fase</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">Catálogo CRUD completo</td>
          <td>100%</td><td>3</td><td>100%</td><td>3</td>
          <td class="rice-score">100</td>
          <td><span class="tag-p1">P1</span> MVP</td>
        </tr>
        <tr>
          <td class="td-bold">Pedidos Kanban + realtime</td>
          <td>100%</td><td>3</td><td>90%</td><td>4</td>
          <td class="rice-score">67</td>
          <td><span class="tag-p1">P1</span> MVP</td>
        </tr>
        <tr>
          <td class="td-bold">Dashboard operacional</td>
          <td>100%</td><td>3</td><td>90%</td><td>2</td>
          <td class="rice-score">135</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Agenda / Slots (eixo serviço)</td>
          <td>60%</td><td>3</td><td>90%</td><td>8</td>
          <td class="rice-score">20</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Notificações WhatsApp</td>
          <td>100%</td><td>3</td><td>90%</td><td>4</td>
          <td class="rice-score">67</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Clientes / CRM básico</td>
          <td>100%</td><td>2</td><td>90%</td><td>3</td>
          <td class="rice-score">60</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Configurações da loja</td>
          <td>100%</td><td>2</td><td>95%</td><td>3</td>
          <td class="rice-score">63</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">PDV offline-first</td>
          <td>80%</td><td>3</td><td>80%</td><td>6</td>
          <td class="rice-score">32</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Fiscal NFC-e via PlugNotas</td>
          <td>90%</td><td>3</td><td>90%</td><td>4</td>
          <td class="rice-score">60</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">KDS + Devices pairing</td>
          <td>70%</td><td>3</td><td>80%</td><td>5</td>
          <td class="rice-score">33</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Estoque CRUD + alertas</td>
          <td>85%</td><td>2</td><td>90%</td><td>3</td>
          <td class="rice-score">51</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">RBAC todas as verticais</td>
          <td>100%</td><td>2</td><td>95%</td><td>2</td>
          <td class="rice-score">95</td>
          <td><span class="tag-p1">P1</span> v1</td>
        </tr>
        <tr>
          <td class="td-bold">Relatórios e Analytics</td>
          <td>100%</td><td>2</td><td>85%</td><td>5</td>
          <td class="rice-score">34</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Dashboard financeiro / DRE</td>
          <td>100%</td><td>2</td><td>80%</td><td>4</td>
          <td class="rice-score">40</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Cupons de desconto</td>
          <td>90%</td><td>2</td><td>85%</td><td>3</td>
          <td class="rice-score">51</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Conciliação bancária OFX</td>
          <td>70%</td><td>2</td><td>75%</td><td>4</td>
          <td class="rice-score">26</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Analytics vitrine marketplace</td>
          <td>100%</td><td>2</td><td>80%</td><td>3</td>
          <td class="rice-score">53</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Fidelidade pontos/cashback</td>
          <td>80%</td><td>2</td><td>80%</td><td>4</td>
          <td class="rice-score">32</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Recipe-level stock (Food)</td>
          <td>50%</td><td>2</td><td>80%</td><td>4</td>
          <td class="rice-score">20</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Comunicados em lote (WhatsApp)</td>
          <td>80%</td><td>2</td><td>70%</td><td>5</td>
          <td class="rice-score">22</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
        <tr>
          <td class="td-bold">Rastreamento de entregador</td>
          <td>70%</td><td>1</td><td>70%</td><td>5</td>
          <td class="rice-score">10</td>
          <td><span class="tag-p3">P3</span> v3</td>
        </tr>
        <tr>
          <td class="td-bold">Vertical Market completa</td>
          <td>60%</td><td>3</td><td>80%</td><td>10</td>
          <td class="rice-score">14</td>
          <td><span class="tag-p2">P2</span> v2</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Resumo por fase</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🚀</span> MVP (Consolidação)</div>
      <ul>
        <li>✅ Shell multi-vertical funcional</li>
        <li>✅ Auth Keycloak + BFF</li>
        <li>🔄 Catálogo CRUD completo</li>
        <li>🔄 Pedidos Kanban realtime</li>
        <li>🔄 RBAC food como molde</li>
      </ul>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⚡</span> v1 (Operação)</div>
      <ul>
        <li>📍 Dashboard operacional</li>
        <li>📍 Configurações da loja</li>
        <li>📍 Agenda / Slots (serviço)</li>
        <li>📍 Clientes / CRM básico</li>
        <li>📍 Notificações WhatsApp</li>
        <li>📍 PDV offline-first</li>
        <li>📍 NFC-e / NF-e PlugNotas</li>
        <li>📍 KDS + Devices pairing</li>
        <li>📍 Estoque CRUD + alertas</li>
        <li>📍 RBAC todas as verticais</li>
      </ul>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📈</span> v2 (Escala)</div>
      <ul>
        <li>💡 Relatórios e Analytics</li>
        <li>💡 DRE + financeiro completo</li>
        <li>💡 Cupons + promoções</li>
        <li>💡 Analytics vitrine</li>
        <li>💡 Conciliação OFX</li>
        <li>💡 Fidelidade pontos/cashback</li>
        <li>💡 Comunicados em lote</li>
        <li>💡 3-4 novas verticais</li>
      </ul>
    </div>
  </div>

  <h2>Wikis verticais planejadas</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Wiki</th><th>Vertical</th><th>Status</th><th>Próximo turno</th></tr></thead>
      <tbody>
        <tr><td><code>wiki-erp-food</code></td><td>Food &amp; Bebidas</td><td><span class="status-badge status-proposed">💡 Planejada</span></td><td>Próximo</td></tr>
        <tr><td><code>wiki-erp-market</code></td><td>Varejo</td><td><span class="status-badge status-proposed">💡 Planejada</span></td><td>A seguir</td></tr>
        <tr><td><code>wiki-erp-beauty</code></td><td>Beauty</td><td><span class="status-badge status-proposed">💡 Planejada</span></td><td>A seguir</td></tr>
        <tr><td><code>wiki-erp-clinic</code></td><td>Clínica</td><td><span class="status-badge status-proposed">💡 Planejada</span></td><td>A seguir</td></tr>
        <tr><td>+8 verticais</td><td>Services, Legal, Realty…</td><td><span class="status-badge status-proposed">💡 Planejada</span></td><td>Turnos futuros</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
