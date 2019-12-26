import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as comporession from 'compression';

/**
 * @description bootstrap initialization
 * @ignore
 */
async function bootstrap(): Promise<never> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({});
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
      transform: true
    }),
  );

  app.use(comporession());
  await app.listen(3303);

  return;
}

bootstrap()
  .then()
  .catch();
