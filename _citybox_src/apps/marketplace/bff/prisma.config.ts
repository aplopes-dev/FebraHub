import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/consumer/schema.prisma',
  datasource: {
    url: env('CONSUMER_DATABASE_URL'),
  },
});
