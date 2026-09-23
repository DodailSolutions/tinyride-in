import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './common/config/env.config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RoutesModule } from './modules/routes/routes.module';
import { KycModule } from './modules/admin/kyc/kyc.module';
import { ParentsModule } from './modules/parents/parents.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TripsModule } from './modules/trips/trips.module';
import { HandoversModule } from './modules/handovers/handovers.module';
import { SafetyModule } from './modules/safety/safety.module';
import { OpsModule } from './modules/admin/ops/ops.module';
import { FinanceModule } from './modules/admin/finance/finance.module';
import { SupportModule } from './modules/admin/support/support.module';
import { SchoolsModule } from './modules/schools/schools.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env', '../.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        autoLogging: {
          ignore: (req) => req.url?.includes('/health/liveness') ?? false,
        },
      },
    }),
    SupabaseModule,
    AuditModule,
    AuthModule,
    DriversModule,
    VehiclesModule,
    RoutesModule,
    KycModule,
    ParentsModule,
    BookingsModule,
    PaymentsModule,
    TripsModule,
    HandoversModule,
    SafetyModule,
    OpsModule,
    FinanceModule,
    SupportModule,
    SchoolsModule,
    HealthModule,
  ],
})
export class AppModule {}
