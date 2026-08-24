import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PatientFile } from '../../domain/entities/patient-file.entity';
import { PatientFolder } from '../../domain/entities/patient-folder.entity';
import {
  PatientFileRepository,
  type PatientDriveListCriteria,
} from '../../domain/repositories/patient-file.repository.interface';
import {
  buildPatientDriveFileWhere,
  buildPatientDriveFolderWhere,
  buildPatientDriveOrderBy,
  buildPatientFileOrderBy,
  toDomainFileKind,
  toPrismaFileKind,
} from './patient-drive-list.where';

@Injectable()
export class PrismaPatientFileRepository extends PatientFileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findFolderById(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<PatientFolder | null> {
    const row = await this.prisma.patientFolder.findFirst({
      where: { id: folderId, storeId, patientId },
    });
    return row ? this.toFolderEntity(row) : null;
  }

  async findFoldersByParentId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFolder[]> {
    const rows = await this.prisma.patientFolder.findMany({
      where: buildPatientDriveFolderWhere(
        storeId,
        patientId,
        criteria.folderId,
        criteria.search,
      ),
      orderBy: buildPatientDriveOrderBy(),
    });
    return rows.map((row) => this.toFolderEntity(row));
  }

  async findAllFoldersByPatientId(
    storeId: string,
    patientId: string,
  ): Promise<PatientFolder[]> {
    const rows = await this.prisma.patientFolder.findMany({
      where: { storeId, patientId },
      orderBy: buildPatientDriveOrderBy(),
    });
    return rows.map((row) => this.toFolderEntity(row));
  }

  async saveFolder(folder: PatientFolder): Promise<PatientFolder> {
    const row = await this.prisma.patientFolder.upsert({
      where: { id: folder.id },
      create: {
        id: folder.id,
        storeId: folder.storeId,
        patientId: folder.patientId,
        parentId: folder.parentId,
        name: folder.name,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
      update: {
        parentId: folder.parentId,
        name: folder.name,
        updatedAt: folder.updatedAt,
      },
    });
    return this.toFolderEntity(row);
  }

  async deleteFolder(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<void> {
    await this.prisma.patientFolder.deleteMany({
      where: { id: folderId, storeId, patientId },
    });
  }

  async findFileById(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<PatientFile | null> {
    const row = await this.prisma.patientFile.findFirst({
      where: { id: fileId, storeId, patientId },
    });
    return row ? this.toFileEntity(row) : null;
  }

  async findFilesByFolderId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFile[]> {
    const rows = await this.prisma.patientFile.findMany({
      where: buildPatientDriveFileWhere(
        storeId,
        patientId,
        criteria.folderId,
        criteria.search,
      ),
      orderBy: buildPatientFileOrderBy(),
    });
    return rows.map((row) => this.toFileEntity(row));
  }

  async findFilesByFolderIds(
    storeId: string,
    patientId: string,
    folderIds: string[],
  ): Promise<PatientFile[]> {
    if (folderIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.patientFile.findMany({
      where: {
        storeId,
        patientId,
        folderId: { in: folderIds },
      },
    });
    return rows.map((row) => this.toFileEntity(row));
  }

  async saveFile(file: PatientFile): Promise<PatientFile> {
    const row = await this.prisma.patientFile.upsert({
      where: { id: file.id },
      create: {
        id: file.id,
        storeId: file.storeId,
        patientId: file.patientId,
        folderId: file.folderId,
        name: file.name,
        objectKey: file.objectKey,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        kind: toPrismaFileKind(file.kind),
        createdAt: file.createdAt,
      },
      update: {
        folderId: file.folderId,
        name: file.name,
      },
    });
    return this.toFileEntity(row);
  }

  async deleteFile(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<void> {
    await this.prisma.patientFile.deleteMany({
      where: { id: fileId, storeId, patientId },
    });
  }

  private toFolderEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    parentId: string | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): PatientFolder {
    return PatientFolder.create(
      {
        storeId: row.storeId,
        patientId: row.patientId,
        parentId: row.parentId,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toFileEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    folderId: string | null;
    name: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    kind: 'image' | 'file';
    createdAt: Date;
  }): PatientFile {
    return PatientFile.create(
      {
        storeId: row.storeId,
        patientId: row.patientId,
        folderId: row.folderId,
        name: row.name,
        objectKey: row.objectKey,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        kind: toDomainFileKind(row.kind),
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
