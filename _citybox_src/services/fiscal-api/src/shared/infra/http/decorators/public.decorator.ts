import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'citybox:public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
