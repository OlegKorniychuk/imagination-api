import { Module } from '@nestjs/common';
import { Config } from 'src/config/index.config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';

export const DRIZZLE = Symbol('drizzle-connection');

@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [Config],
      useFactory: (config: Config) => {
        const dbUrl: string = config.DATABASE_URL;
        const pool = new Pool({ connectionString: dbUrl });
        return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
