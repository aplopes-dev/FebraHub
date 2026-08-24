import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import {
  PosCashSessionRepository,
  type ClosingReport,
} from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { GetClosingReportDto } from '../../dtos/pos-cash-session.dto';

@Injectable()
export class GetClosingReportUseCase implements IUseCase<
  GetClosingReportDto,
  ClosingReport
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: GetClosingReportDto): Promise<ClosingReport> {
    const report = await this.cashSessionRepository.getClosingReport(
      input.organizationId,
      input.sessionId,
    );
    if (!report) throw new PosCashSessionNotFoundError(input.sessionId);
    return report;
  }
}
