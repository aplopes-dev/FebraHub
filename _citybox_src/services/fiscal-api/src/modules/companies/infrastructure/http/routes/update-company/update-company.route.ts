import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateCompanyUseCase } from '../../../../application/use-cases/update-company/update-company.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyPresenter } from '../shared/company.presenter';
import { UpdateCompanyDto } from './update-company.dto';

/// BUG-02 (2026-08-13, defesa em profundidade — a checagem que importa vive
/// em `Company.update()`): `UpdateCompanyDto` nasce com `useDefineForClassFields`,
/// então `dto` tem toda propriedade declarada como chave própria, `undefined`
/// quando ausente do corpo HTTP. Espalhar `dto` cru levaria esses `undefined`
/// pro use case. Filtra antes de montar o input.
function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class UpdateCompanyRoute {
  constructor(private readonly updateCompany: UpdateCompanyUseCase) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados cadastrais do Emitente fiscal' })
  async handle(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    const present = omitUndefined({
      ...dto,
      address: dto.address
        ? { ...dto.address, complement: dto.address.complement ?? null }
        : undefined,
    });
    const company = await this.updateCompany.execute({
      companyId: id,
      ...present,
    });
    return CompanyPresenter.toHttp(company);
  }
}
