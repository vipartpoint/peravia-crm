import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { TerritoriesModule } from './territories/territories.module';
import { ProductsModule } from './products/products.module';
import { PriceListsModule } from './price-lists/price-lists.module';
import { OrdersModule } from './orders/orders.module';
import { LeadsModule } from './leads/leads.module';
import { PresentationsModule } from './presentations/presentations.module';
import { VisitsModule } from './visits/visits.module';
import { TasksModule } from './tasks/tasks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiInsightsModule } from './ai-insights/ai-insights.module';
import { ChequesModule } from './cheques/cheques.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { PaymentsModule } from './payments/payments.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { KpiModule } from './kpi/kpi.module';
import { CommissionsModule } from './commissions/commissions.module';
import { RankingsModule } from './rankings/rankings.module';
import { SessionsModule } from './sessions/sessions.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ExportsModule } from './exports/exports.module';
import { ReportsModule } from './reports/reports.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsCenterModule } from './notifications-center/notifications-center.module';
import { AutomationModule } from './automation/automation.module';
import { HealthModule } from './health/health.module';
import { FinancialModule } from './financial/financial.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { BullModule } from '@nestjs/bullmq';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { ActivitiesModule } from './activities/activities.module';
import { ApprovalCenterModule } from './approval-center/approval-center.module';
import { LicenseModule } from './license/license.module';
import { LicenseGuard } from './license/license/license.guard';
import { CatalogsModule } from './catalogs/catalogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().length(32).required(),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        autoLogging: false,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'password',
            '*.password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'authorization',
            'cookie',
            'set-cookie',
            'phone',
            '*.phone',
            'mobile',
            '*.mobile',
            'nationalId',
            'chequeNumber',
            'bankAccount',
            'cardNumber',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule, AuthModule, UsersModule, CustomersModule,
    TerritoriesModule,
    ProductsModule,
    PriceListsModule,
    OrdersModule,
    LeadsModule,
    PresentationsModule,
    VisitsModule,
    TasksModule,
    DashboardModule,
    AiInsightsModule,
    ChequesModule,
    CustomerPortalModule,
    PaymentsModule,
    ReceivablesModule,
    KpiModule,
    CommissionsModule,
    RankingsModule,
    SessionsModule,
    PermissionsModule,
    ApprovalsModule,
    ApprovalCenterModule,
    ExportsModule,
    ReportsModule,
    AiAssistantModule,
    WarehousesModule,
    InventoryModule,
    NotificationsModule,
    NotificationsCenterModule,
    AutomationModule,
    HealthModule,
    FinancialModule,
    ApiKeysModule,
    DispatchModule,
    OpportunitiesModule,
    LicenseModule,
    CatalogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LicenseGuard,
    }
  ],
})
export class AppModule {}
