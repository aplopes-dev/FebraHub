import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  PatientDriveBreadcrumbDto,
  PatientDriveBreadcrumbSegment,
} from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';
import { buildFolderBreadcrumb } from '../../utils/patient-drive.utils';

@Injectable()
export class GetPatientDriveBreadcrumbUseCase implements IUseCase<
  PatientDriveBreadcrumbDto,
  PatientDriveBreadcrumbSegment[]
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
  ) {}

  async execute(
    dto: PatientDriveBreadcrumbDto,
  ): Promise<PatientDriveBreadcrumbSegment[]> {
    await this.assertPatientExists.execute(
      GetPatientDriveBreadcrumbUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const folderId = dto.folderId ?? null;
    await this.assertFolderExists.executeOptionalParent(
      GetPatientDriveBreadcrumbUseCase.name,
      dto.storeId,
      dto.patientId,
      folderId,
    );

    const folders = await this.repository.findAllFoldersByPatientId(
      dto.storeId,
      dto.patientId,
    );

    return buildFolderBreadcrumb(folders, dto.patientId, folderId);
  }
}
