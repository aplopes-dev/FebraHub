export function brlFull(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function intFmt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

export function phImg(label: string, bg = '#f5f5f5'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><text x="200" y="214" font-family="Mulish,Arial" font-size="27" font-weight="700" fill="rgba(0,0,0,.38)" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
