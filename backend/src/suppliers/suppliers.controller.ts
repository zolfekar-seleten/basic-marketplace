import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Permissions('suppliers.create')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @Permissions('suppliers.view')
  findAll(@Query() query: ListSuppliersDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Permissions('suppliers.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('suppliers.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Patch(':id/activate')
  @Permissions('suppliers.activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Permissions('suppliers.deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.setActive(id, false);
  }
}
