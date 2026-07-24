import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.use-case'
import { DeleteCustomerUseCase } from '../application/use-cases/delete-customer.use-case'
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case'
import { ListCustomersUseCase } from '../application/use-cases/list-customers.use-case'
import { UpdateCustomerUseCase } from '../application/use-cases/update-customer.use-case'
import { CustomerExceptionFilter } from './filters/customer-exception.filter'
import { CreateCustomerDto } from './dtos/create-customer.dto'
import { ListCustomersQuery } from './dtos/list-customers.query'
import { UpdateCustomerDto } from './dtos/update-customer.dto'
import { Roles } from '../../../shared/auth/roles.decorator'
import { UserRole } from '../../../shared/auth/jwt-payload'

@ApiTags('customers')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseFilters(CustomerExceptionFilter)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly getCustomer: GetCustomerUseCase,
    private readonly listCustomers: ListCustomersUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly deleteCustomer: DeleteCustomerUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.createCustomer.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List customers (paginated, excludes deleted)' })
  list(@Query() query: ListCustomersQuery) {
    return this.listCustomers.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by id' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getCustomer.execute(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer contact data (document is immutable)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.updateCustomer.execute({ id, ...dto })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a customer' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteCustomer.execute(id)
  }
}
