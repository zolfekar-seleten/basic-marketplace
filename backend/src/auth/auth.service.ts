import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const buyerRole = await this.rolesRepository.findOneBy({ name: 'buyer' });

    if (!buyerRole) {
      throw new InternalServerErrorException(
        'Buyer role is not configured',
      );
    }

    const password = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password,
      roleId: buyerRole.id,
      role: buyerRole,
    });

    try {
      await this.usersRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: buyerRole.id,
        name: buyerRole.name,
      },
      createdAt: user.createdAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
    const accessToken = await this.jwtService.signAsync({
      sub: authenticatedUser.id,
      name: user.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: authenticatedUser.role,
      },
    };
  }

  getProfile(authorizationContext: UserAuthorizationContext) {
    return {
      id: authorizationContext.id,
      name: authorizationContext.name,
      email: authorizationContext.email,
      role: authorizationContext.role,
      permissions: authorizationContext.permissions,
      permissionsVersion: authorizationContext.permissionsVersion,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'The new password must be different from the current password',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.password')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!user) {
        throw new UnauthorizedException();
      }

      const currentPasswordMatches = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!currentPasswordMatches) {
        throw new BadRequestException('Current password is incorrect');
      }

      const password = await bcrypt.hash(dto.newPassword, 12);
      await manager.getRepository(User).update(userId, { password });
    });

    return { message: 'Password changed successfully' };
  }
}
