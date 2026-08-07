/**
 * Porte de aplopes-dev/hub · backend/src/modules/companies/companies.dto.ts
 * Mantido no estilo do arquivo de origem (aspas duplas) para facilitar o
 * diff contra o upstream. Filtros da Inteligência Territorial.
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const csv = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const toInt = ({ value }: { value: unknown }): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};

const toNumber = ({ value }: { value: unknown }): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const toBool = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
};

export const SORTABLE_FIELDS = [
  "legalName",
  "tradeName",
  "state",
  "city",
  "niche",
  "cnae",
  "revenue",
  "revenueRange",
  "partners",
  "employeeCount",
  "status",
  "openedAt",
  "updatedAt",
  "score",
] as const;

export const COMPANY_STATUSES = ["ativa", "suspensa", "inapta", "baixada"] as const;
export const CONNECTION_TYPES = ["grupo", "socio", "comercial"] as const;
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE",
  "TO", "ND",
] as const;
export const DOCUMENT_TYPES = ["cnpj", "cpf", "nd"] as const;

export class CompanyFiltersDto {
  @ApiPropertyOptional({ description: "Busca global (razão social, fantasia, cidade, nicho, CNAE, sócio, contato)" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: "Slugs de nicho separados por vírgula", example: "tecnologia,saude" })
  @IsOptional()
  @Transform(csv)
  @IsString({ each: true })
  nicheIds?: string[];

  @ApiPropertyOptional({ description: "UFs separadas por vírgula", example: "BA,PE" })
  @IsOptional()
  @Transform(csv)
  @IsIn(UFS as readonly string[], { each: true })
  states?: string[];

  @ApiPropertyOptional({ description: "Cidades separadas por vírgula" })
  @IsOptional()
  @Transform(csv)
  @IsString({ each: true })
  cities?: string[];

  @ApiPropertyOptional({ description: "Faturamento mínimo (R$)" })
  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  revenueMin?: number;

  @ApiPropertyOptional({ description: "Faturamento máximo (R$)" })
  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  revenueMax?: number;

  @ApiPropertyOptional({ description: "Faixas de faturamento (r1..r5) separadas por vírgula" })
  @IsOptional()
  @Transform(csv)
  @Matches(/^r[1-5]$/, { each: true })
  revenueRanges?: string[];

  @ApiPropertyOptional({ description: "Funcionários mínimos" })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  employeesMin?: number;

  @ApiPropertyOptional({ description: "Funcionários máximos" })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  employeesMax?: number;

  @ApiPropertyOptional({ description: "Quantidade mínima de sócios" })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  @Max(50)
  partnersMin?: number;

  @ApiPropertyOptional({ description: "Situações cadastrais separadas por vírgula", example: "ativa,suspensa" })
  @IsOptional()
  @Transform(csv)
  @IsIn(COMPANY_STATUSES as readonly string[], { each: true })
  status?: string[];

  @ApiPropertyOptional({ description: "Ano de abertura — de" })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1900)
  @Max(2100)
  openedFrom?: number;

  @ApiPropertyOptional({ description: "Ano de abertura — até" })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1900)
  @Max(2100)
  openedTo?: number;

  @ApiPropertyOptional({
    description: "Tipos de documento separados por vírgula (cnpj, cpf, nd = sem documento)",
    example: "cpf,cnpj",
  })
  @IsOptional()
  @Transform(csv)
  @IsIn(DOCUMENT_TYPES as readonly string[], { each: true })
  documentTypes?: string[];

  @ApiPropertyOptional({ description: "Possui algum contato" })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hasContact?: boolean;

  @ApiPropertyOptional({ description: "Possui telefone" })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hasPhone?: boolean;

  @ApiPropertyOptional({ description: "Possui e-mail" })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hasEmail?: boolean;

  @ApiPropertyOptional({ description: "Possui website" })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hasWebsite?: boolean;
}

export class ListCompaniesDto extends CompanyFiltersDto {
  @ApiPropertyOptional({ description: "Página (1-based)", default: 1 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Itens por página (máx. 100)", default: 25 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: "revenue" })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS as readonly string[])
  sortBy?: string = "revenue";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

export class ConnectionsQueryDto extends CompanyFiltersDto {
  @ApiPropertyOptional({ description: "Tipos de conexão separados por vírgula", example: "grupo,socio,comercial" })
  @IsOptional()
  @Transform(csv)
  @IsIn(CONNECTION_TYPES as readonly string[], { each: true })
  types?: string[];

  @ApiPropertyOptional({ description: "ID da empresa para focar apenas nas conexões dela" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  focusCompanyId?: string;

  @ApiPropertyOptional({ description: "Teto de conexões retornadas (máx. 800)", default: 400 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(800)
  limit?: number = 400;
}

export class ExportCompaniesDto extends CompanyFiltersDto {
  @ApiPropertyOptional({ description: "Teto de registros exportados (máx. 5000)", default: 5000 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number = 5000;
}
