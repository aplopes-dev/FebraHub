WIKI.register({
  id: 'roadmap-marketplace',
  title: 'Roadmap',
  icon: '🚀',
  searchText: 'roadmap fases RICE app nativo checkout C-05 multi-cidade personalizacao fidelidade quick commerce prioridade impacto esforco score decisoes produto',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">🚀 Roadmap do Marketplace</h1>
    <p class="section-subtitle">Priorização baseada no framework RICE (Reach, Impact, Confidence, Effort). Foco no que desbloqueará usuários reais primeiro — app nativo e checkout orquestrado são a base; fidelidade e multi-cidade são diferenciais de escala.</p>
    <div class="section-tags">
      <span class="tag-indigo">RICE</span>
      <span class="tag-blue">Fase 1</span>
      <span class="tag-violet">Fase 2</span>
      <span class="tag-purple">Fase 3</span>
    </div>
  </div>

  <h2>Matriz RICE — iniciativas</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Iniciativa</th>
          <th>Reach</th>
          <th>Impact</th>
          <th>Confidence</th>
          <th>Effort (sem)</th>
          <th class="rice-score">Score</th>
          <th>Fase</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">PWA consumidor (Next.js)</td>
          <td>10</td><td>10</td><td>90%</td><td>8</td>
          <td class="rice-score">113</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Checkout orquestrado C-05</td>
          <td>10</td><td>10</td><td>90%</td><td>6</td>
          <td class="rice-score">150</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">PIX inline + confirmação real</td>
          <td>10</td><td>10</td><td>95%</td><td>4</td>
          <td class="rice-score">238</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Rastreio realtime (WebSocket)</td>
          <td>10</td><td>8</td><td>80%</td><td>5</td>
          <td class="rice-score">128</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Avaliações pós-entrega</td>
          <td>10</td><td>7</td><td>90%</td><td>4</td>
          <td class="rice-score">158</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Reorder 1-clique</td>
          <td>8</td><td>8</td><td>90%</td><td>3</td>
          <td class="rice-score">192</td>
          <td><span class="tag-p1">P1</span></td>
        </tr>
        <tr>
          <td class="td-bold">App nativo iOS (Swift)</td>
          <td>10</td><td>10</td><td>85%</td><td>20</td>
          <td class="rice-score">43</td>
          <td><span class="tag-p2">P2</span></td>
        </tr>
        <tr>
          <td class="td-bold">App nativo Android (Kotlin)</td>
          <td>10</td><td>10</td><td>85%</td><td>20</td>
          <td class="rice-score">43</td>
          <td><span class="tag-p2">P2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Cupons e cashback</td>
          <td>8</td><td>8</td><td>80%</td><td>6</td>
          <td class="rice-score">85</td>
          <td><span class="tag-p2">P2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Notificações push/WhatsApp</td>
          <td>10</td><td>7</td><td>85%</td><td>5</td>
          <td class="rice-score">119</td>
          <td><span class="tag-p2">P2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Personalização ML (feed/ranking)</td>
          <td>10</td><td>8</td><td>60%</td><td>12</td>
          <td class="rice-score">40</td>
          <td><span class="tag-p3">P3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Multi-cidade (B-01 completo)</td>
          <td>3</td><td>10</td><td>70%</td><td>16</td>
          <td class="rice-score">13</td>
          <td><span class="tag-p3">P3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Quick commerce / dark store</td>
          <td>5</td><td>9</td><td>55%</td><td>20</td>
          <td class="rice-score">12</td>
          <td><span class="tag-p3">P3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Clube premium / assinatura</td>
          <td>5</td><td>8</td><td>60%</td><td>10</td>
          <td class="rice-score">24</td>
          <td><span class="tag-p3">P3</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Fases de desenvolvimento</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🟣</span> Fase 1 — Lançamento (0-3 meses)</div>
      <ul style="font-size:13px;margin-top:8px">
        <li>✅ PWA consumidor (Next.js sobre BFF)</li>
        <li>✅ Checkout C-05 completo com rollback</li>
        <li>✅ PIX inline confirmado via worker</li>
        <li>✅ Rastreio realtime linha do tempo</li>
        <li>✅ Avaliações pós-entrega</li>
        <li>✅ Reorder 1-clique</li>
      </ul>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔵</span> Fase 2 — Crescimento (3-9 meses)</div>
      <ul style="font-size:13px;margin-top:8px">
        <li>📱 App nativo iOS + Android</li>
        <li>🎁 Cupons e cashback básicos</li>
        <li>🔔 Push notifications + WhatsApp</li>
        <li>📍 Mapa do entregador em tempo real</li>
        <li>⭐ Suporte pós-venda in-app</li>
      </ul>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🟤</span> Fase 3 — Escala (9-18 meses)</div>
      <ul style="font-size:13px;margin-top:8px">
        <li>🤖 Personalização ML (feed/ranking)</li>
        <li>🏙️ Multi-cidade (B-01 completo)</li>
        <li>⚡ Quick commerce / dark store</li>
        <li>💎 Clube premium assinatura</li>
        <li>🌍 Gamificação e fidelidade avançada</li>
      </ul>
    </div>
  </div>

  <h2>KPIs de produto</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Métrica</th><th>Meta Fase 1</th><th>Meta Fase 2</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pedidos/dia</td><td>50+</td><td>500+</td></tr>
        <tr><td class="td-bold">Taxa de conversão (home → pedido)</td><td>8%</td><td>12%</td></tr>
        <tr><td class="td-bold">Tempo médio de checkout</td><td>&lt;3 min</td><td>&lt;2 min</td></tr>
        <tr><td class="td-bold">Rating médio das lojas</td><td>4.2+</td><td>4.5+</td></tr>
        <tr><td class="td-bold">Retenção M1 (consumidores)</td><td>30%</td><td>45%</td></tr>
        <tr><td class="td-bold">% pedidos com avaliação</td><td>40%</td><td>60%</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
