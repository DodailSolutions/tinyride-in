import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BRAND_IDENTITY, CORE_COLOURS } from '@tinyride/design-system';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Global correlation ID interceptor
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  // Global exception filter for RFC 7807 problem details
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global DTO validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  });

  // Global API Prefix for domain routes
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health/(.*)', 'health'],
  });

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${BRAND_IDENTITY.name} API`)
    .setDescription(
      `Production REST API for ${BRAND_IDENTITY.name} by ${BRAND_IDENTITY.company}.\n\n` +
      `**Brand Tagline:** *${BRAND_IDENTITY.tagline}*\n` +
      `**Target Market:** Hyderabad, Telangana, India\n` +
      `**Primary Brand Color:** \`${CORE_COLOURS.tinyRideGreen}\`\n\n` +
      `All endpoints require Bearer JWT authentication (issued by Supabase Auth) unless marked as Public.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Supabase Auth JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('System & Health', 'Health checks and diagnostics')
    .addTag('Auth & Identity', 'Authentication and profile management')
    .addTag('Family & Children', 'Parent, child, and guardian operations')
    .addTag('Driver & Supply', 'Driver, vehicle, and route management')
    .addTag('Bookings & Payments', 'Seat holds, reservations, and checkout')
    .addTag('Daily Trips & Safety', 'Trip execution, manifests, and OTP handovers')
    .addTag('Admin Operations', 'KYC review, exception management, and platform audits')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: `${BRAND_IDENTITY.name} API Documentation`,
    customCss: `.swagger-ui .topbar { background-color: ${CORE_COLOURS.deepBlue}; }`,
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(
    `🚀 ${BRAND_IDENTITY.name} API running on port ${port} [Env: ${configService.get('NODE_ENV')}]`,
  );
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health check available at http://localhost:${port}/health/liveness`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during TinyRide API bootstrap:', err);
  process.exit(1);
});
