export interface EtapaProcesso {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  sistema: string;
  tipo: 'tarefa' | 'decisao' | 'aprovacao' | 'inicio' | 'fim';
  regra: string;
  excecao: string;
  gargalo: boolean;
  automacao: boolean;
  agenteIa: boolean;
}

const vazia = (nome = '', i = 0): EtapaProcesso => ({ id: `etapa-${Date.now()}-${i}`, nome, descricao: '', responsavel: '', prazo: '', sistema: '', tipo: 'tarefa', regra: '', excecao: '', gargalo: false, automacao: false, agenteIa: false });

export function normalizarEtapas(valor: unknown, texto = ''): EtapaProcesso[] {
  if (Array.isArray(valor)) return valor.map((e, i) => typeof e === 'string' ? vazia(e, i) : { ...vazia('', i), ...(e as Partial<EtapaProcesso>), id: (e as Partial<EtapaProcesso>).id || `etapa-${i + 1}` });
  return texto.split('\n').map(s => s.replace(/^\d+[.)-]?\s*/, '').trim()).filter(Boolean).map(vazia);
}

const xml = (v: string) => v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

export function gerarBpmn(codigo: string, nome: string, etapas: EtapaProcesso[]): string {
  const nodes = etapas.map((e, i) => {
    const id = `Task_${i + 1}`; const entrada = i === 0 ? 'Flow_start' : `Flow_${i}`; const saida = i === etapas.length - 1 ? 'Flow_end' : `Flow_${i + 1}`;
    const tag = e.tipo === 'decisao' ? 'bpmn:exclusiveGateway' : e.tipo === 'aprovacao' ? 'bpmn:userTask' : 'bpmn:task';
    return `    <${tag} id="${id}" name="${xml(e.nome)}"><bpmn:incoming>${entrada}</bpmn:incoming><bpmn:outgoing>${saida}</bpmn:outgoing><bpmn:documentation>${xml([e.descricao,e.responsavel&&`Responsável: ${e.responsavel}`,e.prazo&&`Prazo: ${e.prazo}`,e.regra&&`Regra: ${e.regra}`,e.excecao&&`Exceção: ${e.excecao}`].filter(Boolean).join(' | '))}</bpmn:documentation></${tag}>`;
  }).join('\n');
  const flows = [`    <bpmn:sequenceFlow id="Flow_start" sourceRef="StartEvent_1" targetRef="Task_1"/>`, ...etapas.slice(1).map((_,i)=>`    <bpmn:sequenceFlow id="Flow_${i+1}" sourceRef="Task_${i+1}" targetRef="Task_${i+2}"/>`), `    <bpmn:sequenceFlow id="Flow_end" sourceRef="Task_${etapas.length}" targetRef="EndEvent_1"/>`].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_${xml(codigo)}" targetNamespace="https://febracis.com.br/processos">\n  <bpmn:process id="Process_${xml(codigo)}" name="${xml(nome)}" isExecutable="false">\n    <bpmn:startEvent id="StartEvent_1" name="Início"><bpmn:outgoing>Flow_start</bpmn:outgoing></bpmn:startEvent>\n${nodes}\n    <bpmn:endEvent id="EndEvent_1" name="Fim"><bpmn:incoming>Flow_end</bpmn:incoming></bpmn:endEvent>\n${flows}\n  </bpmn:process>\n</bpmn:definitions>`;
}

export function gerarSvg(nome: string, etapas: EtapaProcesso[]): string {
  const w = Math.max(900, etapas.length * 240 + 180), h = 260;
  const blocos = etapas.map((e,i)=>{const x=120+i*240;return `<g><rect x="${x}" y="80" width="180" height="92" rx="14" fill="#fff" stroke="#c9a44e" stroke-width="2"/><circle cx="${x}" cy="126" r="18" fill="#c9a44e"/><text x="${x}" y="131" text-anchor="middle" fill="#18140b" font-size="12" font-weight="700">${i+1}</text><text x="${x+28}" y="112" fill="#8b6b20" font-size="9">ETAPA ${i+1}</text><text x="${x+28}" y="135" fill="#24221f" font-size="12" font-weight="700">${xml(e.nome.slice(0,22))}</text>${i<etapas.length-1?`<line x1="${x+180}" y1="126" x2="${x+230}" y2="126" stroke="#c9a44e" stroke-width="2"/><path d="M ${x+222} 120 L ${x+230} 126 L ${x+222} 132" fill="none" stroke="#c9a44e" stroke-width="2"/>`:''}</g>`}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#f8f6f0"/><text x="40" y="38" font-family="sans-serif" font-size="18" font-weight="700" fill="#24221f">${xml(nome)}</text>${blocos}</svg>`;
}

export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([conteudo],{type:tipo})); a.download=nome; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
