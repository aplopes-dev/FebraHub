import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosTerminalRepository } from './domain/repositories/pos-terminal.repository.interface';
import { PrismaPosTerminalRepository } from './infrastructure/database/prisma-pos-terminal.repository';
import { CreatePosTerminalUseCase } from './application/use-cases/create-pos-terminal/create-pos-terminal.use-case';
import { ListPosTerminalsUseCase } from './application/use-cases/list-pos-terminals/list-pos-terminals.use-case';
import { FindPosTerminalByIdUseCase } from './application/use-cases/find-pos-terminal-by-id/find-pos-terminal-by-id.use-case';
import { UpdatePosTerminalUseCase } from './application/use-cases/update-pos-terminal/update-pos-terminal.use-case';
import { DeletePosTerminalUseCase } from './application/use-cases/delete-pos-terminal/delete-pos-terminal.use-case';
import { GeneratePairingCodeUseCase } from './application/use-cases/generate-pairing-code/generate-pairing-code.use-case';
import { RedeemPairingCodeUseCase } from './application/use-cases/redeem-pairing-code/redeem-pairing-code.use-case';
import { GetCurrentTerminalUseCase } from './application/use-cases/get-current-terminal/get-current-terminal.use-case';
import { RevokeDeviceUseCase } from './application/use-cases/revoke-device/revoke-device.use-case';
import { CreatePosTerminalRoute } from './infrastructure/http/routes/create-pos-terminal/create-pos-terminal.route';
import { ListPosTerminalsRoute } from './infrastructure/http/routes/list-pos-terminals/list-pos-terminals.route';
import { FindPosTerminalByIdRoute } from './infrastructure/http/routes/find-pos-terminal-by-id/find-pos-terminal-by-id.route';
import { UpdatePosTerminalRoute } from './infrastructure/http/routes/update-pos-terminal/update-pos-terminal.route';
import { DeletePosTerminalRoute } from './infrastructure/http/routes/delete-pos-terminal/delete-pos-terminal.route';
import { GeneratePairingCodeRoute } from './infrastructure/http/routes/generate-pairing-code/generate-pairing-code.route';
import { RedeemPairingCodeRoute } from './infrastructure/http/routes/redeem-pairing-code/redeem-pairing-code.route';
import { RevokeDeviceRoute } from './infrastructure/http/routes/revoke-device/revoke-device.route';
import { CurrentTerminalRoute } from './infrastructure/http/routes/current-terminal/current-terminal.route';
import { DeviceAuthGuard } from '../../shared/infra/http/guards/device-auth.guard';

@Module({
  imports: [TenancyModule],
  controllers: [
    ListPosTerminalsRoute,
    CreatePosTerminalRoute,
    FindPosTerminalByIdRoute,
    UpdatePosTerminalRoute,
    DeletePosTerminalRoute,
    GeneratePairingCodeRoute,
    // `pair/redeem` antes de `:id/...`: o Nest resolve na ordem de registro, e
    // a rota com parâmetro capturaria "pair" como se fosse um id.
    RedeemPairingCodeRoute,
    RevokeDeviceRoute,
    CurrentTerminalRoute,
  ],
  providers: [
    { provide: PosTerminalRepository, useClass: PrismaPosTerminalRepository },
    CreatePosTerminalUseCase,
    ListPosTerminalsUseCase,
    FindPosTerminalByIdUseCase,
    UpdatePosTerminalUseCase,
    DeletePosTerminalUseCase,
    GeneratePairingCodeUseCase,
    RedeemPairingCodeUseCase,
    GetCurrentTerminalUseCase,
    RevokeDeviceUseCase,
    DeviceAuthGuard,
  ],
  exports: [PosTerminalRepository, DeviceAuthGuard],
})
export class PosTerminalsModule {}
