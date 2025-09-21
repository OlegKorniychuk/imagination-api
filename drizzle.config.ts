import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/modules/drizzle/schema/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.db__DATABASE_URL!,
  },
});
