import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ResolveProfessionalCouncilService } from '../../../../../members/application/services/resolve-professional-council.service';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientCertificate } from '../../../domain/entities/patient-certificate.entity';
import { PatientCertificateRepository } from '../../../domain/repositories/patient-certificate.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { parseIssuedDateOnly } from '../../utils/patient-certificate-dates';
import type { CreatePatientCertificateDto } from '../../dtos/patient-certificate.dto';

function normalizeOptionalText(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CreatePatientCertificateUseCase implements IUseCase<
  CreatePatientCertificateDto,
  PatientCertificate
> {
  constructor(
    private readonly certificateRepository: PatientCertificateRepository,
    private readonly patientRepository: PatientRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly resolveProfessionalCouncil: ResolveProfessionalCouncilService,
  ) {}

  async execute(dto: CreatePatientCertificateDto): Promise<PatientCertificate> {
    await this.assertPatientExists.execute(
      CreatePatientCertificateUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new Error('Patient should exist after assertion');
    }

    const professionalId = dto.input.professionalId.trim();
    const council = await this.resolveProfessionalCouncil.execute({
      context: CreatePatientCertificateUseCase.name,
      professionalId,
      storeId: dto.storeId,
      input: {
        councilType: dto.input.councilType,
        councilNumber: dto.input.councilNumber,
        councilUf: dto.input.councilUf,
      },
    });

    const issuedDate = parseIssuedDateOnly(dto.input.issuedDate);
    const issuedAt = new Date();
    const cid = normalizeOptionalText(dto.input.cid);
    const clinicName = normalizeOptionalText(dto.input.clinicName);

    const certificate = PatientCertificate.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      professionalId,
      professionalName: dto.input.professionalName.trim(),
      councilType: council.councilType,
      councilNumber: council.councilNumber,
      councilUf: council.councilUf,
      patientName: patientDetail.patient.name,
      clinicName,
      type: dto.input.type,
      issuedDate,
      issuedAt,
      daysCount:
        dto.input.type === 'days'
          ? normalizeOptionalText(dto.input.daysCount)
          : null,
      startTime:
        dto.input.type === 'attendance'
          ? normalizeOptionalText(dto.input.startTime)
          : null,
      endTime:
        dto.input.type === 'attendance'
          ? normalizeOptionalText(dto.input.endTime)
          : null,
      cid,
    });

    return this.certificateRepository.save(certificate);
  }
}
