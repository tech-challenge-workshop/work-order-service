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
import { CreateVehicleUseCase } from '../application/use-cases/create-vehicle.use-case'
import { DeleteVehicleUseCase } from '../application/use-cases/delete-vehicle.use-case'
import { GetVehicleUseCase } from '../application/use-cases/get-vehicle.use-case'
import { ListVehiclesUseCase } from '../application/use-cases/list-vehicles.use-case'
import { UpdateVehicleUseCase } from '../application/use-cases/update-vehicle.use-case'
import { VehicleExceptionFilter } from './filters/vehicle-exception.filter'
import { CreateVehicleDto } from './dtos/create-vehicle.dto'
import { ListVehiclesQuery } from './dtos/list-vehicles.query'
import { UpdateVehicleDto } from './dtos/update-vehicle.dto'

@ApiTags('vehicles')
@ApiBearerAuth()
@UseFilters(VehicleExceptionFilter)
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly createVehicle: CreateVehicleUseCase,
    private readonly getVehicle: GetVehicleUseCase,
    private readonly listVehicles: ListVehiclesUseCase,
    private readonly updateVehicle: UpdateVehicleUseCase,
    private readonly deleteVehicle: DeleteVehicleUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle for a customer' })
  create(@Body() dto: CreateVehicleDto) {
    return this.createVehicle.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles (paginated, excludes deleted)' })
  list(@Query() query: ListVehiclesQuery) {
    return this.listVehicles.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by id' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getVehicle.execute(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle data (plate and owner are immutable)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.updateVehicle.execute({ id, ...dto })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a vehicle' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteVehicle.execute(id)
  }
}
