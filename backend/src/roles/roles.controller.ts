import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SynchronizeRolePermissionsDto } from './dto/synchronize-role-permissions.dto';
import { RolesService } from './roles.service';

interface AuthorizationRequest extends Request {
  authorizationContext?: UserAuthorizationContext;
}

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.view')
  findAll() {
    return this.rolesService.getRoles();
  }

  @Get(':id/permissions')
  @Permissions('roles.view')
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRolePermissions(id);
  }

  @Put(':id/permissions')
  @Permissions('roles.assign_permissions')
  synchronizePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SynchronizeRolePermissionsDto,
    @Req() request: AuthorizationRequest,
  ) {
    const assignedBy = request.authorizationContext?.id;

    if (!assignedBy) {
      throw new UnauthorizedException();
    }

    return this.rolesService.synchronizePermissions(id, dto.permissionIds, assignedBy);
  }
}
