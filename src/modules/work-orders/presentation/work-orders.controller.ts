import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { OpenWorkOrderUseCase } from '../application/use-cases/open-work-order.use-case'
import { GetWorkOrderUseCase } from '../application/use-cases/get-work-order.use-case'
import { ListWorkOrdersUseCase } from '../application/use-cases/list-work-orders.use-case'
import { WorkOrderExceptionFilter } from './filters/work-order-exception.filter'
import { OpenWorkOrderDto } from './dtos/open-work-order.dto'
import { ListWorkOrdersQuery } from './dtos/list-work-orders.query'

@ApiTags('work-orders')
@ApiBearerAuth()
@UseFilters(WorkOrderExceptionFilter)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(
    private readonly openWorkOrder: OpenWorkOrderUseCase,
    private readonly getWorkOrder: GetWorkOrderUseCase,
    private readonly listWorkOrders: ListWorkOrdersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Open a new work order' })
  open(@Body() dto: OpenWorkOrderDto) {
    return this.openWorkOrder.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List active work orders (excludes terminal statuses)' })
  list(@Query() query: ListWorkOrdersQuery) {
    return this.listWorkOrders.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work order by id, including items and status history' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getWorkOrder.execute(id)
  }
}
