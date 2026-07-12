import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CustomersModule } from './modules/customers/customers.module'
import { validateEnv } from './shared/config/env'
import { PrismaModule } from './shared/database/prisma.module'
import { HealthController } from './shared/health/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    CustomersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
