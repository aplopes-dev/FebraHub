/** Estilos do papel A4 — alinhados ao RichTextEditor (`page="a4"`). */
export const PATIENT_CONTRACT_PAPER_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
}
[data-rte-paper] {
  --paper: #ffffff;
  --paper-foreground: #111111;
  box-sizing: border-box;
  width: 210mm;
  max-width: 100%;
  min-height: 297mm;
  margin: 0 auto;
  padding: 25mm;
  background-color: var(--paper);
  color: var(--paper-foreground);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 10px 30px rgba(0, 0, 0, 0.12);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(297mm - 1px),
    color-mix(in oklch, var(--paper-foreground) 14%, transparent) calc(297mm - 1px),
    color-mix(in oklch, var(--paper-foreground) 14%, transparent) 297mm
  );
  background-origin: border-box;
  background-repeat: repeat-y;
  overflow-wrap: anywhere;
  word-wrap: break-word;
}
[data-rte-paper] img,
[data-rte-paper] table,
[data-rte-paper] pre,
[data-rte-paper] video {
  max-width: 100%;
}
[data-rte-paper] img,
[data-rte-paper] video {
  height: auto;
}
[data-rte-paper] table {
  border-collapse: collapse;
}
[data-rte-paper] ul {
  list-style: disc;
  padding-left: 1.5em;
}
[data-rte-paper] ol {
  list-style: decimal;
  padding-left: 1.5em;
}
[data-rte-paper] [data-variable] {
  background-color: color-mix(in oklch, var(--paper-foreground) 8%, transparent);
  color: var(--paper-foreground);
  border-color: color-mix(in oklch, var(--paper-foreground) 22%, transparent);
}
@media print {
  html, body {
    width: 100%;
    height: auto;
    background: #fff;
  }
  body * { visibility: hidden !important; }
  [data-rte-paper], [data-rte-paper] * { visibility: visible !important; }
  [data-rte-paper] {
    position: absolute;
    inset: 0 auto auto 0;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-height: auto;
    margin: 0;
    padding: 18mm;
    box-shadow: none;
    background-image: none;
    background-color: #fff;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }
}
`;
