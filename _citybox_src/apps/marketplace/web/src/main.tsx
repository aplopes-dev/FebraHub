import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '@/i18n';
import App from '@/App';
import '@/index.css';

function renderApp() {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error(i18n.t('bootstrap.rootNotFound', { ns: 'common' }));
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

async function bootstrap() {
  if (import.meta.env.VITE_API_MODE !== 'live') {
    try {
      const { startMockWorker } = await import('@/mocks/browser');
      await startMockWorker();
    } catch (err) {
      // Se o Service Worker do MSW falhar, ainda renderiza a app (não deixa
      // tela branca) — as chamadas cairão na rede real / falharão visivelmente.
      console.error('[MSW] Falha ao iniciar o mock worker:', err);
    }
  }

  renderApp();
}

void bootstrap();
