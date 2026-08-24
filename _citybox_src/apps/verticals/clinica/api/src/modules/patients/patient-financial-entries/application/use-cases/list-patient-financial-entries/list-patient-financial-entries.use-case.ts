import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';
import type {
  ListPatientFinancialEntriesDto,
  ListPatientFinancialEntriesResult,
} from '../../dtos/patient-financial-entry.dto';

@Injectable()
export class ListPatientFinancialEntriesUseCase implements IUseCase<
  ListPatientFinancialEntriesDto,
  ListPatientFinancialEntriesResult
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
  ) {}

  async execute(
    dto: ListPatientFinancialEntriesDto,
  ): Promise<ListPatientFinancialEntriesResult> {
    await this.assertPatientExists.execute(
      ListPatientFinancialEntriesUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 10;
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: dto.search,
      status: dto.status,
      periodFrom: dto.periodFrom,
      periodTo: dto.periodTo,
      budgetItemId: dto.budgetItemId,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    const [rawItems, total, totals] = await Promise.all([
      this.entryRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.entryRepository.countByPatientId(dto.storeId, dto.patientId, {
        search: dto.search,
        status: dto.status,
        periodFrom: dto.periodFrom,
        periodTo: dto.periodTo,
        budgetItemId: dto.budgetItemId,
        sortBy: dto.sortBy,
        sortOrder: dto.sortOrder,
      }),
      this.entryRepository.sumTotalsByPatientId(dto.storeId, dto.patientId, {
        periodFrom: dto.periodFrom,
        periodTo: dto.periodTo,
      }),
    ]);

    const items = await this.hydrateDebitDetail.hydrateMany(rawItems);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
      totals,
    };
  }
}
