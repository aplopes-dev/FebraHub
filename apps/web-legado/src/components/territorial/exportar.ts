/* Exportação da Inteligência Territorial — porte funcional do
   frontend/src/lib/export.ts do hub: CSV, XLSX e PDF gerados no navegador
   com import dinâmico (não entram no bundle inicial), documento SEMPRE
   mascarado. O recorte exportado é o dos filtros ativos, teto de 5000
   (o backend devolve `truncated` e a UI avisa). */

import type { Company, DocumentType } from "@/lib/territorial/tipos";
import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import { STATUS_LABELS } from "@/lib/territorial/tipos";

export function mascararDocumento(doc: string, tipo: DocumentType): string {
  if (tipo === "cnpj" && doc.length >= 14) {
    return `${doc.slice(0, 2)}.***.***/${doc.slice(8, 12)}-**`;
  }
  if (tipo === "cpf" && doc.replace(/\D/g, "").length === 11) {
    const d = doc.replace(/\D/g, "");
    return `***.${d.slice(3, 6)}.***-${d.slice(9)}`;
  }
  return "Sem documento";
}

interface Coluna {
  nome: string;
  de: (c: Company) => string | number;
}

const COLUNAS: Coluna[] = [
  { nome: "Razão social", de: (c) => c.legalName },
  { nome: "Nome fantasia", de: (c) => c.tradeName },
  { nome: "Documento", de: (c) => mascararDocumento(c.document, c.documentType) },
  { nome: "Nicho", de: (c) => (isNicheId(c.nicheId) ? NICHE_MAP[c.nicheId].name : c.nicheId) },
  { nome: "Cidade", de: (c) => c.city },
  { nome: "UF", de: (c) => c.state },
  { nome: "Sócios", de: (c) => c.partners.length },
  { nome: "Telefones", de: (c) => c.contacts.filter((k) => k.type === "telefone").map((k) => k.value).join(" · ") },
  { nome: "E-mails", de: (c) => c.contacts.filter((k) => k.type === "email").map((k) => k.value).join(" · ") },
  { nome: "Website", de: (c) => c.website ?? "" },
  { nome: "Situação", de: (c) => STATUS_LABELS[c.status] ?? c.status },
  { nome: "Relevância", de: (c) => c.score },
  { nome: "Grupo econômico", de: (c) => c.groupName ?? "" },
  { nome: "Atualização", de: (c) => c.updatedAt.slice(0, 10) },
];

function baixar(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarCsv(empresas: Company[]): void {
  const escapar = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const linhas = [
    COLUNAS.map((c) => c.nome).join(";"),
    ...empresas.map((e) => COLUNAS.map((c) => escapar(c.de(e))).join(";")),
  ];
  baixar(
    new Blob([`﻿${linhas.join("\r\n")}`], { type: "text/csv;charset=utf-8" }),
    "inteligencia_territorial.csv"
  );
}

export async function exportarXlsx(empresas: Company[]): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Empresas", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = COLUNAS.map((c) => ({ header: c.nome, width: Math.max(14, c.nome.length + 4) }));
  for (const e of empresas) ws.addRow(COLUNAS.map((c) => c.de(e)));
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUNAS.length } };
  const buffer = await wb.xlsx.writeBuffer();
  baixar(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "inteligencia_territorial.xlsx"
  );
}

export async function exportarPdf(empresas: Company[], descricaoRecorte: string): Promise<void> {
  const { default: JsPdf } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new JsPdf({ orientation: "landscape", format: "a4" });
  doc.setFontSize(13);
  doc.text("Inteligência Territorial — FebraHub", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(descricaoRecorte || "Sem filtros — base completa", 14, 20);
  const compactas = COLUNAS.filter((c) =>
    ["Razão social", "Nicho", "Cidade", "UF", "Sócios", "Telefones", "Situação", "Relevância"].includes(c.nome)
  );
  autoTable(doc, {
    startY: 25,
    head: [compactas.map((c) => c.nome)],
    body: empresas.map((e) => compactas.map((c) => String(c.de(e)))),
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: [184, 147, 74] },
    didDrawPage: () => {
      const n = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(`FebraHub · Febracis Salvador — página ${n}`, 14, doc.internal.pageSize.getHeight() - 6);
    },
  });
  doc.save("inteligencia_territorial.pdf");
}
