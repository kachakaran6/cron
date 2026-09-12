import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { client } from '@cron-saas/database';

async function runStartupMigrations(logger: Logger) {
  try {
    // Idempotent schema patches — safe to run on every startup
    await client`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(255)
    `;
    logger.log('Startup migrations applied successfully');
  } catch (err: any) {
    // Non-fatal — log and continue (tables may not exist yet on first boot)
    logger.warn(`Startup migration warning: ${err.message}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Run idempotent schema patches before accepting traffic
  await runStartupMigrations(logger);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('CronPlatform API')
    .setDescription('Production Distributed Cron Scheduling and Monitoring Engine API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Web Dashboard JWT Token' },
      'dashboard-jwt'
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-API-Key', in: 'header', description: 'Programmatic API Key (cr_live_...)' },
      'api-key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
