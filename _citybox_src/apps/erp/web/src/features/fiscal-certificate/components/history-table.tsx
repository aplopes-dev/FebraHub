"use client";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { formatCnpj } from "@/lib/br-format";
import { CertificateStatusBadge } from "./certificate-status-badge";
import type { CertificateView } from "../types/certificate";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

/**
 * Histórico somente-leitura dos certificados não vigentes (FR-017): sem ação de
 * "Ativar" nem de "Excluir" — vale sempre o VALID mais recente.
 */
export function CertificateHistoryTable({
  certificates,
}: {
  certificates: CertificateView[];
}) {
  if (certificates.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        Histórico de certificados
      </Typography>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Validade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Enviado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.name ?? "—"}</TableCell>
                <TableCell>{formatCnpj(cert.subjectCnpj)}</TableCell>
                <TableCell>
                  {formatDate(cert.validFrom)} – {formatDate(cert.validUntil)}
                </TableCell>
                <TableCell>
                  <CertificateStatusBadge status={cert.status} />
                </TableCell>
                <TableCell>{formatDate(cert.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
