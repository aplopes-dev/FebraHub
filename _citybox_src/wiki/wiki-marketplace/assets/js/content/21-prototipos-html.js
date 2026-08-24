WIKI.register({
  id: 'prototipos-html',
  title: 'Protótipos interativos',
  icon: '🖥️',
  searchText: 'prototipo interativo html bundle mockup app mobile web desktop telas navegavel iframe citybox-app citybox-web citybox-telas demo clicavel react vue',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Design e Mockups</div>
    <h1 class="section-title">🖥️ Protótipos interativos (HTML)</h1>
    <p class="section-subtitle">As telas reais dos protótipos que guiaram a implementação, embarcadas aqui e <strong>navegáveis ao vivo</strong>. São os mesmos arquivos da pasta <code>docs/</code> (<code>CityBox-App.html</code>, <code>CityBox-Web.html</code>, <code>CityBox-Telas.html</code>) — apps compilados que você pode clicar e percorrer sem sair da wiki.</p>
    <div class="section-tags">
      <span class="tag-indigo">App mobile</span>
      <span class="tag-blue">Web desktop</span>
      <span class="tag-violet">Galeria de telas</span>
      <span class="tag-gray">Interativo</span>
    </div>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">🖱️</span>
    <div class="alert-body">
      <div class="alert-title">Como usar</div>
      <p>Cada protótipo abaixo é interativo: clique nos botões, abas e cards para navegar pelas telas como no app real. São bundles pesados — o primeiro carregamento pode levar alguns segundos. Use o link <strong>Abrir em nova aba</strong> para ver em tela cheia. Para a visão curada tela-a-tela, veja também <strong>Mockups do App</strong>.</p>
    </div>
  </div>

  <div class="prototype-block">
    <div class="prototype-head">
      <span class="prototype-head-title">📱 App mobile — consumidor</span>
      <span class="prototype-head-tag">paridade Android (Compose) × iOS (SwiftUI) · estado mock em memória</span>
    </div>
    <div class="prototype-stage">
      <iframe class="prototype-iframe prototype-iframe-phone" src="assets/mockups/app.html" loading="lazy" title="Protótipo do app mobile CityBox" referrerpolicy="no-referrer"></iframe>
    </div>
    <div class="prototype-foot">
      <a class="prototype-link" href="assets/mockups/app.html" target="_blank" rel="noopener">Abrir em nova aba ↗</a>
      <span class="prototype-hint">Splash → Login → Home → PDP → Carrinho → Checkout → Confirmação, favoritos, busca, PIX 5%, rastreio.</span>
    </div>
  </div>

  <div class="prototype-block">
    <div class="prototype-head">
      <span class="prototype-head-title">💻 Web — app do consumidor</span>
      <span class="prototype-head-tag">React + Vite · layouts desktop de auth e jornada de compra</span>
    </div>
    <div class="prototype-stage">
      <iframe class="prototype-iframe prototype-iframe-web" src="assets/mockups/web.html" loading="lazy" title="Protótipo web CityBox" referrerpolicy="no-referrer"></iframe>
    </div>
    <div class="prototype-foot">
      <a class="prototype-link" href="assets/mockups/web.html" target="_blank" rel="noopener">Abrir em nova aba ↗</a>
      <span class="prototype-hint">Mesma fachada <code>cityboxApi</code> da implementação real, com backend mock MSW (76 endpoints).</span>
    </div>
  </div>

  <div class="prototype-block">
    <div class="prototype-head">
      <span class="prototype-head-title">🗂️ Galeria de telas</span>
      <span class="prototype-head-tag">visão consolidada das telas e variações</span>
    </div>
    <div class="prototype-stage">
      <iframe class="prototype-iframe prototype-iframe-web" src="assets/mockups/telas.html" loading="lazy" title="Galeria de telas CityBox" referrerpolicy="no-referrer"></iframe>
    </div>
    <div class="prototype-foot">
      <a class="prototype-link" href="assets/mockups/telas.html" target="_blank" rel="noopener">Abrir em nova aba ↗</a>
      <span class="prototype-hint">Útil para revisar layout e hierarquia de todas as telas de uma vez.</span>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">🔗</span>
    <div class="alert-body">
      <div class="alert-title">De onde vêm estes arquivos</div>
      <p>Cópias fiéis de <code>docs/CityBox-App.html</code>, <code>docs/CityBox-Web.html</code> e <code>docs/CityBox-Telas.html</code>, versionadas em <code>wiki/wiki-marketplace/assets/mockups/</code>. Para entender os dados por trás de cada tela, veja <strong>Backend mock (MSW)</strong>, <strong>Fluxos e navegação</strong> e <strong>Contrato BFF/API</strong>.</p>
    </div>
  </div>
</div>
`
});
