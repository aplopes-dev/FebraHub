import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  PatientMoveDestination,
  PatientMoveDestinationsDto,
} from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import {
  buildMoveDestinationLabel,
  collectDescendantFolderIds,
  sortDriveItemsByName,
} from '../../utils/patient-drive.utils';

@Injectable()
export class ListPatientMoveDestinationsUseCase implements IUseCase<
  PatientMoveDestinationsDto,
  PatientMoveDestination[]
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: PatientMoveDestinationsDto,
  ): Promise<PatientMoveDestination[]> {
    await this.assertPatientExists.execute(
      ListPatientMoveDestinationsUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const folders = await this.repository.findAllFoldersByPatientId(
      dto.storeId,
      dto.patientId,
    );

    const excluded = new Set(dto.excludeFolderIds ?? []);
    if (dto.excludeFolderSubtreeId) {
      for (const folderId of collectDescendantFolderIds(
        folders,
        dto.excludeFolderSubtreeId,
      )) {
        excluded.add(folderId);
      }
    }

    const destinations = sortDriveItemsByName(
      folders.filter((folder) => !excluded.has(folder.id)),
    ).map((folder) => ({
      id: folder.id,
      label: buildMoveDestinationLabel(folders, dto.patientId, folder.id),
    }));

    return [{ id: null, label: 'Arquivos' }, ...destinations];
  }
}
