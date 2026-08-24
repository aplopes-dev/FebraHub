export function createPdfObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokePdfObjectUrl(url: string | null | undefined): void {
  if (!url) {
    return;
  }

  URL.revokeObjectURL(url);
}

export function downloadPatientEvolutionPdf(blob: Blob, fileName: string): void {
  const url = createPdfObjectUrl(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.click();
  revokePdfObjectUrl(url);
}

export function printPatientEvolutionPdf(blob: Blob): void {
  const url = createPdfObjectUrl(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  const cleanup = () => {
    revokePdfObjectUrl(url);
    iframe.remove();
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 1_000);
  };

  document.body.append(iframe);
}
