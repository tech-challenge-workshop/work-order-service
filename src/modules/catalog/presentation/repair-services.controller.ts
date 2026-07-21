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
import { CreateRepairServiceUseCase } from '../application/use-cases/create-repair-service.use-case'
import { DeleteRepairServiceUseCase } from '../application/use-cases/delete-repair-service.use-case'
import { GetRepairServiceUseCase } from '../application/use-cases/get-repair-service.use-case'
import { ListRepairServicesUseCase } from '../application/use-cases/list-repair-services.use-case'
import { UpdateRepairServiceUseCase } from '../application/use-cases/update-repair-service.use-case'
import { RepairServiceExceptionFilter } from './filters/repair-service-exception.filter'
import { CreateRepairServiceDto } from './dtos/create-repair-service.dto'
import { ListRepairServicesQuery } from './dtos/list-repair-services.query'
import { UpdateRepairServiceDto } from './dtos/update-repair-service.dto'

@ApiTags('repair-services')
@ApiBearerAuth()
@UseFilters(RepairServiceExceptionFilter)
@Controller('repair-services')
export class RepairServicesController {
  constructor(
    private readonly createRepairService: CreateRepairServiceUseCase,
    private readonly getRepairService: GetRepairServiceUseCase,
    private readonly listRepairServices: ListRepairServicesUseCase,
    private readonly updateRepairService: UpdateRepairServiceUseCase,
    private readonly deleteRepairService: DeleteRepairServiceUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new repair service in the catalog' })
  create(@Body() dto: CreateRepairServiceDto) {
    return this.createRepairService.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List repair services (paginated, excludes deleted)' })
  list(@Query() query: ListRepairServicesQuery) {
    return this.listRepairServices.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repair service by id' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getRepairService.execute(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a repair service' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRepairServiceDto) {
    return this.updateRepairService.execute({ id, ...dto })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a repair service' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteRepairService.execute(id)
  }
}
