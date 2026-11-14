import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly jwtService: JwtService,
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

  getProfile(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
