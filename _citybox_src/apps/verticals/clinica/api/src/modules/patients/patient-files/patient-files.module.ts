import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients.module';
import { PatientFileRepository } from './domain/repositories/patient-file.repository.interface';
import { PrismaPatientFileRepository } from './infrastructure/database/prisma-patient-file.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from './application/services/assert-patient-folder-exists.service';
import { ListPatientDriveUseCase } from './application/use-cases/list-patient-drive/list-patient-drive.use-case';
import { GetPatientDriveBreadcrumbUseCase } from './application/use-cases/get-patient-drive-breadcrumb/get-patient-drive-breadcrumb.use-case';
import { ListPatientMoveDestinationsUseCase } from './application/use-cases/list-patient-move-destinations/list-patient-move-destinations.use-case';
import { CreatePatientFolderUseCase } from './application/use-cases/create-patient-folder/create-patient-folder.use-case';
import { RenamePatientFolderUseCase } from './application/use-cases/rename-patient-folder/rename-patient-folder.use-case';
import { MovePatientFolderUseCase } from './application/use-cases/move-patient-folder/move-patient-folder.use-case';
import { DeletePatientFolderUseCase } from './application/use-cases/delete-patient-folder/delete-patient-folder.use-case';
import { UploadPatientFileUseCase } from './application/use-cases/upload-patient-file/upload-patient-file.use-case';
import { GetPatientFileContentUseCase } from './application/use-cases/get-patient-file-content/get-patient-file-content.use-case';
import { RenamePatientFileUseCase } from './application/use-cases/rename-patient-file/rename-patient-file.use-case';
import { MovePatientFileUseCase } from './application/use-cases/move-patient-file/move-patient-file.use-case';
import { DeletePatientFileUseCase } from './application/use-cases/delete-patient-file/delete-patient-file.use-case';
import { ListPatientDriveRoute } from './infrastructure/http/routes/list-patient-drive/list-patient-drive.route';
import { GetPatientDriveBreadcrumbRoute } from './infrastructure/http/routes/get-patient-drive-breadcrumb/get-patient-drive-breadcrumb.route';
import { ListPatientMoveDestinationsRoute } from './infrastructure/http/routes/list-patient-move-destinations/list-patient-move-destinations.route';
import { CreatePatientFolderRoute } from './infrastructure/http/routes/create-patient-folder/create-patient-folder.route';
import { RenamePatientFolderRoute } from './infrastructure/http/routes/rename-patient-folder/rename-patient-folder.route';
import { MovePatientFolderRoute } from './infrastructure/http/routes/move-patient-folder/move-patient-folder.route';
import { DeletePatientFolderRoute } from './infrastructure/http/routes/delete-patient-folder/delete-patient-folder.route';
import { PatientFileRoute } from './infrastructure/http/routes/patient-file/patient-file.route';

@Module({
  imports: [forwardRef(() => PatientsModule)],
  controllers: [
    ListPatientDriveRoute,
    GetPatientDriveBreadcrumbRoute,
    ListPatientMoveDestinationsRoute,
    CreatePatientFolderRoute,
    RenamePatientFolderRoute,
    MovePatientFolderRoute,
    DeletePatientFolderRoute,
    PatientFileRoute,
  ],
  providers: [
    {
      provide: PatientFileRepository,
      useClass: PrismaPatientFileRepository,
    },
    AssertPatientExistsService,
    AssertPatientFolderExistsService,
    ListPatientDriveUseCase,
    GetPatientDriveBreadcrumbUseCase,
    ListPatientMoveDestinationsUseCase,
    CreatePatientFolderUseCase,
    RenamePatientFolderUseCase,
    MovePatientFolderUseCase,
    DeletePatientFolderUseCase,
    UploadPatientFileUseCase,
    GetPatientFileContentUseCase,
    RenamePatientFileUseCase,
    MovePatientFileUseCase,
    DeletePatientFileUseCase,
  ],
})
export class PatientFilesModule {}
