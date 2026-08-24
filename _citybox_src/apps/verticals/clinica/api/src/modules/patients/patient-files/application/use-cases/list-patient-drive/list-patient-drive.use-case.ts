import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  PatientDriveListDto,
  PatientDriveListResult,
} from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';
import { sortDriveItemsByName } from '../../utils/patient-drive.utils';

@Injectable()
export class ListPatientDriveUseCase implements IUseCase<
  PatientDriveListDto,
  PatientDriveListResult
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
  ) {}

  async execute(dto: PatientDriveListDto): Promise<PatientDriveListResult> {
    await this.assertPatientExists.execute(
      ListPatientDriveUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const folderId = dto.folderId ?? null;
    await this.assertFolderExists.executeOptionalParent(
      ListPatientDriveUseCase.name,
      dto.storeId,
      dto.patientId,
      folderId,
    );

    const criteria = { folderId, search: dto.search };
    const [folders, files] = await Promise.all([
      this.repository.findFoldersByParentId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.repository.findFilesByFolderId(dto.storeId, dto.patientId, criteria),
    ]);

    return {
      folders: sortDriveItemsByName(folders),
      files: sortDriveItemsByName(files),
    };
  }
}
