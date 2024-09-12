import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { items } from './config';

async function initialiseDatabase() {
  const appService = new AppService();
  await appService.createDatabase();
  await appService.readDatabase();
  await appService.createContainer();
  await appService.readContainer();
  await appService.scaleContainer();
  for await (const item of items) {
    appService.createFamilyItem(item);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);
  await initialiseDatabase();
}

bootstrap();
