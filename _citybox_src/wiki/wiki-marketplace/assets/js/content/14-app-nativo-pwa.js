WIKI.register({
  id: 'app-nativo-pwa',
  title: 'App Nativo e PWA',
  icon: '📱',
  searchText: 'app nativo Swift Kotlin iOS Android B-08 BFF PWA progressive web app design system mobile React Native Flutter telas principais UX mobile',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Apps e Arquitetura</div>
    <h1 class="section-title">📱 App Nativo e PWA</h1>
    <p class="section-subtitle">A decisão B-08 define app nativo Swift (iOS) + Kotlin (Android) como frontend do consumidor, conversando exclusivamente com o BFF. PWA complementa para acesso web. As pastas do app estão vazias — este blueprint define o que construir.</p>
    <div class="section-tags">
      <span class="tag-indigo">B-08</span>
      <span class="tag-blue">Swift iOS</span>
      <span class="tag-blue">Kotlin Android</span>
      <span class="tag-green">PWA</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje</div>
    <p>Pastas <code>apps/marketplace/web</code>, <code>apps/marketplace/ios</code>, <code>apps/marketplace/android</code> existem mas estão <strong>vazias</strong>. O BFF está pronto para ser consumido. Toda a API de consumer (home, busca, loja, oferta, carrinho) já está implementada no BFF.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta — App nativo MVP</div>
    <p>Swift + Kotlin nativos consumindo BFF. Cinco tabs principais. Push notifications via FCM/APNS. Suporte a PIX QR inline. Mapa do entregador (Google Maps / Apple Maps). Biometria/Face ID para checkout. PWA como fallback web para usuários que não instalam o app.</p>
  </div>

  <h2>Arquitetura cliente → servidor</h2>
  <div class="mermaid">
flowchart LR
  iOS["📱 iOS\nSwift / UIKit / SwiftUI"] -->|"HTTPS + JWT"| BFF["BFF :3102\n/v1/app/*"]
  Android["📱 Android\nKotlin / Jetpack Compose"] -->|"HTTPS + JWT"| BFF
  PWA["🌐 PWA\nNext.js"] -->|"HTTPS + JWT"| BFF
  BFF --> Cache["Redis\ncache read path"]
  BFF --> DB[("Postgres\nread models")]
  BFF --> TS["Typesense"]
  </div>

  <h2>Telas principais (5 tabs)</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🏠</span> Tab 1: Home</div>
      <p>Discovery, categorias, banners, lojas perto, pedidos recentes, reorder. Feed personalizado.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔍</span> Tab 2: Busca</div>
      <p>Busca product-first, filtros por vertical/preço/dieta, histórico de buscas, sugestões.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🛒</span> Tab 3: Carrinho</div>
      <p>Cesta multiloja, fees, cupom, botão de checkout. Badge com quantidade de itens.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">📦</span> Tab 4: Pedidos</div>
      <p>Pedidos ativos (acompanhamento em tempo real) + histórico. Reorder 1-clique.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">👤</span> Tab 5: Perfil</div>
      <p>Conta, endereços, cartões salvos, preferências de notificação, cupons/cashback, suporte.</p>
    </div>
  </div>

  <h2>Por que nativo vs React Native / Flutter</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Critério</th><th>Swift + Kotlin</th><th>React Native</th><th>Flutter</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Performance UI</td><td class="cap-yes">✅ Máxima (nativo)</td><td class="cap-opt">🔶 Quase nativo</td><td class="cap-opt">🔶 Bom</td></tr>
        <tr><td class="td-bold">Acesso a APIs nativas</td><td class="cap-yes">✅ Total</td><td class="cap-opt">🔶 Via bridge</td><td class="cap-opt">🔶 Via plugin</td></tr>
        <tr><td class="td-bold">Push + Biometria + Mapas</td><td class="cap-yes">✅ Direto</td><td class="cap-yes">✅ com libs</td><td class="cap-yes">✅ com libs</td></tr>
        <tr><td class="td-bold">Código compartilhado</td><td class="cap-na">— (2 codebases)</td><td class="cap-yes">✅ 1 codebase</td><td class="cap-yes">✅ 1 codebase</td></tr>
        <tr><td class="td-bold">Time disponível</td><td>Depende</td><td>Dev web pode contribuir</td><td>Depende</td></tr>
        <tr><td class="td-bold">Decisão B-08</td><td class="cap-yes">✅ Definido</td><td>—</td><td>—</td></tr>
      </tbody>
    </table>
  </div>

  <h2>PWA — complemento web</h2>
  <ul>
    <li>Next.js (App Router) consumindo o mesmo BFF</li>
    <li>Service worker para funcionamento offline parcial (cardápios cacheados)</li>
    <li>Manifest para "adicionar à tela inicial"</li>
    <li>Push via Web Push API (limitado no iOS Safari até iOS 16.4)</li>
    <li>Casos de uso: acesso no desktop, usuários que não instalam app, compartilhamento de oferta</li>
  </ul>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Caminho pragmático para primeira versão</div>
      <p>Com BFF pronto, a primeira versão do app pode ser construída como <strong>PWA Next.js</strong> (web mobile) enquanto os apps nativos Swift/Kotlin são desenvolvidos em paralelo. O PWA compartilha o mesmo BFF e permite validar o produto com usuários reais antes de lançar nas stores. Estratégia: PWA → beta fechado → app nativo v1.</p>
    </div>
  </div>
</div>
`
});
