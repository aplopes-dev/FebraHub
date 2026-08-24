import type { Prisma } from '../../../../../../generated/prisma/client';
import { PatientFileKind } from '../../../../../../generated/prisma/client';

export function buildPatientDriveFolderWhere(
  storeId: string,
  patientId: string,
  folderId: string | null,
  search?: string,
): Prisma.PatientFolderWhereInput {
  const where: Prisma.PatientFolderWhereInput = {
    storeId,
    patientId,
    parentId: folderId,
  };

  if (search?.trim()) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  return where;
}

export function buildPatientDriveFileWhere(
  storeId: string,
  patientId: string,
  folderId: string | null,
  search?: string,
): Prisma.PatientFileWhereInput {
  const where: Prisma.PatientFileWhereInput = {
    storeId,
    patientId,
    folderId,
  };

  if (search?.trim()) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }

  return where;
}

export function buildPatientDriveOrderBy(): Prisma.PatientFolderOrderByWithRelationInput {
  return { name: 'asc' };
}

export function buildPatientFileOrderBy(): Prisma.PatientFileOrderByWithRelationInput {
  return { name: 'asc' };
}

export function toDomainFileKind(kind: PatientFileKind): 'image' | 'file' {
  return kind;
}

export function toPrismaFileKind(kind: 'image' | 'file'): PatientFileKind {
  return kind;
}
