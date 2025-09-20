import { InferSelectModel } from 'drizzle-orm';
import { users } from 'src/modules/drizzle/schema/users.schema';

export type User = InferSelectModel<typeof users>;
