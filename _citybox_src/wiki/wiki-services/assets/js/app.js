/* ============================================================
   Wiki Services Citybox — App Core
   Router por hash, navegação, busca, feedback, Mermaid
   ============================================================ */

(function () {
  'use strict';

  const NAV_GROUPS = [
    {
      id: 'intro',
      label: 'Introdução',
      items: ['visao-geral']
    },
    {
      id: 'services',
      label: 'Serviços',
      items: ['payment-api']
    },
    {
      id: 'evolucao',
      label: 'Evolução',
      items: ['como-aprovar']
    }
  ];

  function $(id)    { return document.getElementById(id); }
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  function getSectionById(id) {
    return WIKI.sections.find(function (s) { return s.id === id; });
  }

  var FEEDBACK_KEY = 'wiki_services_feedback';

  function getAllFeedback() {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveFeedback(sectionId, data) {
    var all = getAllFeedback();
    all[sectionId] = data;
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
    updateProgress();
    updateNavIndicators();
  }
  function getFeedback(sectionId) {
    return getAllFeedback()[sectionId] || { status: 'pending', comment: '' };
  }

  function updateProgress() {
    var all = getAllFeedback();
    var excludeIds = ['como-aprovar'];
    var total = WIKI.sections.filter(function(s){ return !excludeIds.includes(s.id); }).length;
    var done  = Object.keys(all).filter(function(id){ return !excludeIds.includes(id) && all[id].status === 'approved'; }).length;
    var pct   = total > 0 ? Math.round((done / total) * 100) : 0;
    var txt   = $('progressText');
    var fill  = $('progressFill');
    if (txt)  txt.textContent  = done + ' de ' + total + ' seções aprovadas';
    if (fill) fill.style.width = pct + '%';
  }

  function updateNavIndicators() {
    var all = getAllFeedback();
    qsa('.nav-item-badge').forEach(function (badge) {
      var id = badge.dataset.id;
      var fb = all[id] || { status: 'pending' };
      badge.className = 'nav-item-badge ' + fb.status;
    });
  }

  function renderFeedbackWidget(sectionId) {
    if (sectionId === 'como-aprovar') return '';
    var fb = getFeedback(sectionId);
    var isApproved = fb.status === 'approved';
    var isAdjusted = fb.status === 'adjusted';
    return '<div class="feedback-widget" id="feedbackWidget">' +
      '<div class="feedback-title">📝 Aprovação desta seção</div>' +
      '<div class="feedback-desc">Leia o conteúdo acima e indique se aprova ou se deseja solicitar ajustes.</div>' +
      '<div class="feedback-actions">' +
        '<button class="feedback-btn feedback-btn-approve' + (isApproved ? ' active' : '') + '" id="btnApprove">✅ Aprovar esta seção</button>' +
        '<button class="feedback-btn feedback-btn-adjust' + (isAdjusted ? ' active' : '') + '" id="btnAdjust">✏️ Solicitar ajuste</button>' +
      '</div>' +
      '<div class="feedback-comment-area' + (isAdjusted ? ' visible' : '') + '" id="feedbackCommentArea">' +
        '<textarea class="feedback-textarea" id="feedbackTextarea" placeholder="Descreva aqui os ajustes que deseja...">' + (fb.comment || '') + '</textarea>' +
        '<button class="feedback-save-btn" id="feedbackSaveBtn">Salvar comentário</button>' +
      '</div>' +
      '<div class="feedback-status' + (isApproved ? ' show approved' : (isAdjusted ? ' show adjusted' : '')) + '" id="feedbackStatus">' +
        (isApproved ? '✅ Seção aprovada!' : (isAdjusted ? '✏️ Ajuste solicitado — comentário salvo.' : '')) +
      '</div>' +
    '</div>';
  }

  function bindFeedbackEvents(sectionId) {
    var btnApprove  = $('btnApprove');
    var btnAdjust   = $('btnAdjust');
    var commentArea = $('feedbackCommentArea');
    var saveBtn     = $('feedbackSaveBtn');
    var statusDiv   = $('feedbackStatus');
    var textarea    = $('feedbackTextarea');
    if (!btnApprove) return;
    btnApprove.addEventListener('click', function () {
      saveFeedback(sectionId, { status: 'approved', comment: '' });
      btnApprove.classList.add('active');
      btnAdjust.classList.remove('active');
      if (commentArea) commentArea.classList.remove('visible');
      if (statusDiv) { statusDiv.textContent = '✅ Seção aprovada!'; statusDiv.className = 'feedback-status show approved'; }
      updateNavIndicators();
    });
    btnAdjust.addEventListener('click', function () {
      btnAdjust.classList.add('active');
      btnApprove.classList.remove('active');
      if (commentArea) commentArea.classList.add('visible');
      if (statusDiv) statusDiv.className = 'feedback-status';
    });
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var comment = textarea ? textarea.value : '';
        saveFeedback(sectionId, { status: 'adjusted', comment: comment });
        if (statusDiv) { statusDiv.textContent = '✏️ Ajuste solicitado — comentário salvo.'; statusDiv.className = 'feedback-status show adjusted'; }
        updateNavIndicators();
      });
    }
  }

  function renderSection(section) {
    var container = $('section-content');
    if (!container) return;
    container.innerHTML = section.html + renderFeedbackWidget(section.id);
    var main = $('mainContent');
    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);
    if (typeof mermaid !== 'undefined') {
      try { mermaid.run({ querySelector: '.mermaid' }); } catch (e) { console.warn('Mermaid render error:', e); }
    }
    bindFeedbackEvents(section.id);
    updateActiveNav(section.id);
    if (section.id === 'como-aprovar') { populateApprovalSummary(); }
  }

  function route() {
    var hash    = location.hash.replace('#', '').trim();
    var section = getSectionById(hash) || WIKI.sections[0];
    if (section) renderSection(section);
  }

  function updateActiveNav(id) {
    qsa('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  function buildNav() {
    var nav = $('sidebarNav');
    if (!nav) return;
    var html = '';
    var all  = getAllFeedback();
    NAV_GROUPS.forEach(function (group) {
      html += '<div class="nav-group"><div class="nav-group-label">' + group.label + '</div>';
      group.items.forEach(function (itemId) {
        var section = getSectionById(itemId);
        if (!section) return;
        var fb = all[itemId] || { status: 'pending' };
        html += '<a href="#' + itemId + '" class="nav-item" data-id="' + itemId + '">' +
          '<span class="nav-item-icon">' + (section.icon || '📄') + '</span>' +
          '<span class="nav-item-label">' + section.title + '</span>' +
          '<span class="nav-item-badge ' + fb.status + '" data-id="' + itemId + '"></span>' +
        '</a>';
      });
      html += '</div>';
    });
    nav.innerHTML = html;
    nav.addEventListener('click', function (e) {
      var item = e.target.closest('.nav-item');
      if (item) { var href = item.getAttribute('href'); if (href) location.hash = href.replace('#', ''); }
    });
  }

  function initSearch() {
    var trigger  = $('searchTrigger');
    var overlay  = $('searchOverlay');
    var backdrop = $('searchBackdrop');
    var input    = $('searchInput');
    var results  = $('searchResults');
    if (!trigger || !overlay) return;
    function openSearch()  { overlay.classList.add('open'); if (input) setTimeout(function(){ input.focus(); }, 50); }
    function closeSearch() { overlay.classList.remove('open'); if (input) input.value = ''; if (results) results.innerHTML = ''; }
    trigger.addEventListener('click', openSearch);
    if (backdrop) backdrop.addEventListener('click', closeSearch);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') closeSearch();
    });
    if (input) {
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        if (!q || q.length < 2) { results.innerHTML = ''; return; }
        var matches = WIKI.sections.filter(function (s) {
          return (s.title + ' ' + s.searchText + ' ' + (s.id || '')).toLowerCase().includes(q);
        }).slice(0, 8);
        if (!matches.length) { results.innerHTML = '<div class="search-empty">Nenhum resultado para "<strong>' + q + '</strong>"</div>'; return; }
        results.innerHTML = matches.map(function (s) {
          var excerpt = (s.searchText || '').substring(0, 80).replace(/</g, '&lt;');
          return '<div class="search-result-item" data-id="' + s.id + '">' +
            '<div class="search-result-icon">' + (s.icon || '📄') + '</div>' +
            '<div><div class="search-result-title">' + s.title + '</div><div class="search-result-excerpt">' + excerpt + '…</div></div>' +
          '</div>';
        }).join('');
        qsa('.search-result-item').forEach(function (el) {
          el.addEventListener('click', function () { location.hash = el.dataset.id; closeSearch(); });
        });
      });
    }
  }

  function populateApprovalSummary() {
    var container = $('approvalSummaryContainer');
    if (!container) return;
    var all  = getAllFeedback();
    var html = '';
    WIKI.sections.forEach(function (s) {
      if (s.id === 'como-aprovar') return;
      var fb = all[s.id] || { status: 'pending', comment: '' };
      var badge = fb.status === 'approved'
        ? '<span class="badge badge-approved">Aprovada</span>'
        : (fb.status === 'adjusted' ? '<span class="badge badge-adjusted">Com ajuste</span>' : '<span class="badge badge-pending">Pendente</span>');
      var comment = (fb.comment && fb.status === 'adjusted') ? '<div class="approval-summary-comment">"' + fb.comment + '"</div>' : '';
      html += '<div class="approval-summary-card"><div class="approval-summary-status">' + badge + '</div><div><div class="approval-summary-title">' + (s.icon || '') + ' ' + s.title + '</div>' + comment + '</div></div>';
    });
    container.innerHTML = html || '<p style="color:var(--text-muted)">Nenhuma seção revisada ainda.</p>';
  }

  function initExport() {
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'exportFeedbackBtn') {
        var all  = getAllFeedback();
        var text = 'RELATÓRIO DE APROVAÇÃO — Wiki Services Citybox\n';
        text    += 'Gerado em: ' + new Date().toLocaleString('pt-BR') + '\n' + '='.repeat(50) + '\n\n';
        WIKI.sections.forEach(function (s) {
          if (s.id === 'como-aprovar') return;
          var fb = all[s.id] || { status: 'pending', comment: '' };
          var statusLabel = fb.status === 'approved' ? 'APROVADA' : (fb.status === 'adjusted' ? 'AJUSTE SOLICITADO' : 'PENDENTE');
          text += s.title + '\nStatus: ' + statusLabel + '\n';
          if (fb.comment) text += 'Comentário: ' + fb.comment + '\n';
          text += '-'.repeat(40) + '\n';
        });
        navigator.clipboard.writeText(text).then(function () {
          var btn = $('exportFeedbackBtn');
          if (btn) { btn.textContent = '✅ Copiado!'; setTimeout(function(){ btn.innerHTML = '📋 Copiar relatório'; }, 2000); }
        }).catch(function () { alert(text); });
      }
      if (e.target && e.target.id === 'printFeedbackBtn') { window.print(); }
    });
  }

  function initMobileMenu() {
    var toggle  = $('menuToggle');
    var sidebar = document.querySelector('.sidebar');
    if (!toggle || !sidebar) return;
    var mq = window.matchMedia('(max-width: 700px)');
    function onMq(e) { toggle.style.display = e.matches ? 'block' : 'none'; }
    mq.addEventListener('change', onMq);
    onMq(mq);
    toggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) { sidebar.classList.remove('open'); }
    });
  }

  function init() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontSize: 14, flowchart: { curve: 'basis', useMaxWidth: true }, securityLevel: 'loose' });
    }
    buildNav();
    route();
    initSearch();
    initExport();
    initMobileMenu();
    updateProgress();
    window.addEventListener('hashchange', route);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
