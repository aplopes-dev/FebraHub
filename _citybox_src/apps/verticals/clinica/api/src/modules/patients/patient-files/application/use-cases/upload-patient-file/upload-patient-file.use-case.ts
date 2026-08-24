import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFile } from '../../../domain/entities/patient-file.entity';
import type { UploadPatientFileDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { PatientFileObjectKeyPolicy } from '../../policies/patient-file-object-key.policy';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';
import { PatientFileMimeValidator } from '../../validators/patient-file-mime.validator';

@Injectable()
export class UploadPatientFileUseCase implements IUseCase<
  UploadPatientFileDto,
  PatientFile
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadPatientFileDto): Promise<PatientFile> {
    await this.assertPatientExists.execute(
      UploadPatientFileUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    await this.assertFolderExists.executeOptionalParent(
      UploadPatientFileUseCase.name,
      dto.storeId,
      dto.patientId,
      dto.folderId,
    );

    const mimeType = PatientFileMimeValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
      UploadPatientFileUseCase.name,
    );

    const file = PatientFile.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      folderId: dto.folderId,
      name: dto.name.trim() || 'arquivo',
      objectKey: '',
      mimeType,
      sizeBytes: dto.buffer.length,
      kind: PatientFileMimeValidator.inferKind(mimeType),
    });

    const objectKey = PatientFileObjectKeyPolicy.fileKey(
      dto.storeId,
      dto.patientId,
      file.id,
      mimeType,
    );

    await this.storage.put({
      key: objectKey,
      buffer: dto.buffer,
      mimeType,
    });

    const saved = PatientFile.create(
      {
        storeId: dto.storeId,
        patientId: dto.patientId,
        folderId: dto.folderId,
        name: file.name,
        objectKey,
        mimeType,
        sizeBytes: dto.buffer.length,
        kind: file.kind,
      },
      file.id,
    );

    return this.repository.saveFile(saved);
  }
}
