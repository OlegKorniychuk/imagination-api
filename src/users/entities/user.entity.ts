import { InferSelectModel } from 'drizzle-orm';
import { users } from 'src/drizzle/schema/users.schema';

export type User = InferSelectModel<typeof users>;
