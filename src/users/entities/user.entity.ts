import { InferSelectModel } from 'drizzle-orm';
import { users } from '../../drizzle/schema/users.schema';

export type User = InferSelectModel<typeof users>;
