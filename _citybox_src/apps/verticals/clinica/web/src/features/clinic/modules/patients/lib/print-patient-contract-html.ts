import { PATIENT_CONTRACT_PAPER_CSS } from './patient-contract-paper-styles';

export function printPatientContractHtml(html: string, title: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // Dimensione o iframe em A4 (fora da tela): width/height 0 faz o layout de
  // impressão calcular conteúdo estreito demais e cortar a margem direita.
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';

  let didPrint = false;

  const cleanup = () => {
    iframe.remove();
  };

  const triggerPrint = () => {
    if (didPrint) {
      return;
    }

    const frameWindow = iframe.contentWindow;
    const frameDoc = iframe.contentDocument;
    if (!frameWindow || !frameDoc || frameDoc.readyState !== 'complete') {
      return;
    }

    const paper = frameDoc.querySelector('[data-rte-paper]');
    if (!paper || !paper.innerHTML.trim()) {
      return;
    }

    didPrint = true;

    const onAfterPrint = () => {
      frameWindow.removeEventListener('afterprint', onAfterPrint);
      cleanup();
    };

    frameWindow.addEventListener('afterprint', onAfterPrint);
    frameWindow.focus();
    frameWindow.print();

    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        cleanup();
      }
    }, 60_000);
  };

  document.body.append(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    cleanup();
    return;
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>${PATIENT_CONTRACT_PAPER_CSS}</style></head><body><div data-rte-paper="true"></div></body></html>`,
  );
  doc.close();
  doc.title = title;

  const paper = doc.querySelector('[data-rte-paper]');
  if (paper) {
    paper.innerHTML = html;
  }

  iframe.onload = triggerPrint;
  queueMicrotask(triggerPrint);
}
