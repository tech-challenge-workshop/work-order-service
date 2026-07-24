import {
  Controller,
  ForbiddenException,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { OpenWorkOrderUseCase } from '../application/use-cases/open-work-order.use-case'
import { GetWorkOrderUseCase } from '../application/use-cases/get-work-order.use-case'
import { GetExecutionTimeMetricsUseCase } from '../application/use-cases/get-execution-time-metrics.use-case'
import { ListWorkOrdersUseCase } from '../application/use-cases/list-work-orders.use-case'
import { WorkOrderExceptionFilter } from './filters/work-order-exception.filter'
import { OpenWorkOrderDto } from './dtos/open-work-order.dto'
import { ListWorkOrdersQuery } from './dtos/list-work-orders.query'
import { Roles } from '../../../shared/auth/roles.decorator'
import { CurrentUser } from '../../../shared/auth/current-user.decorator'
import { UserRole } from '../../../shared/auth/jwt-payload'
import type { JwtPayload } from '../../../shared/auth/jwt-payload'

@ApiTags('work-orders')
@ApiBearerAuth()
@UseFilters(WorkOrderExceptionFilter)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(
    private readonly openWorkOrder: OpenWorkOrderUseCase,
    private readonly getWorkOrder: GetWorkOrderUseCase,
    private readonly listWorkOrders: ListWorkOrdersUseCase,
    private readonly getExecutionTimeMetrics: GetExecutionTimeMetricsUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Open a new work order' })
  open(@Body() dto: OpenWorkOrderDto) {
    return this.openWorkOrder.execute(dto)
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List active work orders (excludes terminal statuses)' })
  list(@Query() query: ListWorkOrdersQuery) {
    return this.listWorkOrders.execute(query)
  }

  @Get('metrics/execution-time')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Average execution time (IN_EXECUTION → FINISHED) in seconds across finished orders',
  })
  metricsExecutionTime() {
    return this.getExecutionTimeMetrics.execute()
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get a work order by id (customers may only read their own)' })
  async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const workOrder = await this.getWorkOrder.execute(id)
    if (user.role === UserRole.CUSTOMER && workOrder.customerId !== user.sub) {
      throw new ForbiddenException('Customers may only read their own work orders')
    }
    return workOrder
  }
}
