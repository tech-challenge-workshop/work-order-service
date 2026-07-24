import { Module } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from './application/ports/customer.repository'
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case'
import { DeleteCustomerUseCase } from './application/use-cases/delete-customer.use-case'
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case'
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case'
import { LookupCustomerByDocumentUseCase } from './application/use-cases/lookup-customer-by-document.use-case'
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case'
import { PrismaCustomerRepository } from './infra/prisma-customer.repository'
import { CustomersController } from './presentation/customers.controller'

@Module({
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    LookupCustomerByDocumentUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
