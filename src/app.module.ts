import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CatalogModule } from './modules/catalog/catalog.module'
import { CustomersModule } from './modules/customers/customers.module'
import { VehiclesModule } from './modules/vehicles/vehicles.module'
import { WorkOrdersModule } from './modules/work-orders/work-orders.module'
import { SagaModule } from './modules/saga/saga.module'
import { AuthModule } from './shared/auth/auth.module'
import { validateEnv } from './shared/config/env'
import { PrismaModule } from './shared/database/prisma.module'
import { HealthController } from './shared/health/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    PrismaModule,
    CustomersModule,
    VehiclesModule,
    CatalogModule,
    WorkOrdersModule,
    SagaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
