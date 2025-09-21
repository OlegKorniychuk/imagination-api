import { Module } from '@nestjs/common';
import { DbConfig } from 'src/config/index.config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';
import { DrizzleDB } from './types/drizzle';

export const DRIZZLE = Symbol('drizzle-connection');

@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [DbConfig],
      useFactory: (dbConfig: DbConfig) => {
        const dbUrl: string = dbConfig.DATABASE_URL;
        const pool = new Pool({ connectionString: dbUrl });
        return drizzle(pool, { schema }) as DrizzleDB;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
