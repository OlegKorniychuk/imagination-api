import { NestFactory } from '@nestjs/core';
import { SeedModule } from './modules/_seed/seed.module';
import { SeedService } from './modules/_seed/seed.service';
import { Command } from 'commander';

async function bootstrap(users: number, imagesPerUser: number) {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  try {
    console.log(
      `Seeding ${users} user(s) with ${imagesPerUser} image(s) each...`,
    );
    await seedService.seed(users, imagesPerUser);
    console.log('✅ Successfully completed seeding.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

const program = new Command();

program
  .version('1.0.0')
  .description('A CLI to seed the database for the Imagination API')
  .option('-u, --users <number>', 'Number of users to seed', '5')
  .option('-i, --images <number>', 'Number of images per user', '10')
  .parse(process.argv);

// Get the parsed options
const options = program.opts<{ users: string; images: string }>();
const userCount = parseInt(options.users, 10);
const imageCount = parseInt(options.images, 10);

bootstrap(userCount, imageCount);
