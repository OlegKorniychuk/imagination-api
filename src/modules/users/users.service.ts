import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DRIZZLE } from 'src/modules/drizzle/drizzle.module';
import { DrizzleDB } from 'src/modules/drizzle/types/drizzle';
import { users } from 'src/modules/drizzle/schema/users.schema';
import { eq } from 'drizzle-orm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const [result] = await this.db
      .insert(users)
      .values(createUserDto)
      .returning();

    return result;
  }

  async findAll(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async findOne(id: string): Promise<User | undefined> {
    const [result] = await this.db.select().from(users).where(eq(users.id, id));

    return result;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | undefined> {
    const [result] = await this.db
      .update(users)
      .set(updateUserDto)
      .where(eq(users.id, id))
      .returning();

    return result;
  }

  async remove(id: string): Promise<User | undefined> {
    const [result] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return result;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [result] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return result;
  }
}
