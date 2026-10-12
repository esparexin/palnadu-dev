import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createUserSchema } from '@palnadu/validation';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  async create(@Body() body: unknown) {
    const parseResult = createUserSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const user = await this.usersService.create(parseResult.data as any);
    return { success: true, data: user };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const { z, userRoleValues } = await import('@palnadu/validation');
    const patchSchema = z.object({
      name: z.string().trim().min(2).max(100).optional(),
      role: z.enum(userRoleValues).optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(8).max(128).optional(),
    });
    const parseResult = patchSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const user = await this.usersService.update(id, parseResult.data as any);
    return { success: true, data: user };
  }
}
