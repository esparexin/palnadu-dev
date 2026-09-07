import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { success: true, data: users };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  @Post()
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      role: UserRole;
    },
  ) {
    const user = await this.usersService.create(body);
    return { success: true, data: user };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    },
  ) {
    const user = await this.usersService.update(id, body);
    return { success: true, data: user };
  }
}
