import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PciPayloadInterceptor } from './pci-payload.interceptor.js';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: PciPayloadInterceptor }],
})
export class SecurityModule {}
