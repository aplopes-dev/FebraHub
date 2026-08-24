import { Global, Module } from '@nestjs/common';
import { ObjectStorage } from '../../domain/storage/object-storage.interface';
import { MinioObjectStorage } from './minio/minio-object-storage';

@Global()
@Module({
  providers: [
    {
      provide: ObjectStorage,
      useClass: MinioObjectStorage,
    },
  ],
  exports: [ObjectStorage],
})
export class StorageModule {}
