import { Module } from '@nestjs/common';
import { DbConfig } from 'src/config/index.config';
import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';
import { DrizzleDB } from './types/drizzle';
import { readFileSync } from 'fs';
import path from 'path';

export const DRIZZLE = Symbol('drizzle-connection');

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [DbConfig],
      useFactory: (dbConfig: DbConfig) => {
        const dbUrl: string = dbConfig.DATABASE_URL;
        const connectionConfig: PoolConfig = { connectionString: dbUrl };

        if (isProduction) {
          const caCert = readFileSync(
            path.join(
              __dirname,
              '../../../../config/certs',
              dbConfig.CA_CERT_FILENAME,
            ),
          ).toString();
          connectionConfig.ssl = { rejectUnauthorized: true, ca: caCert };
        } else {
          connectionConfig.ssl = false;
        }

        const pool = new Pool(connectionConfig);
        return drizzle(pool, { schema }) as DrizzleDB;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
