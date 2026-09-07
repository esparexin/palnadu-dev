import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ClientCreateInput) {
    return this.prisma.client.create({ data });
  }

  async findAll(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ClientWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { projects: true } }),
      this.prisma.client.count({ where }),
    ]);

    return { data: clients, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    return this.prisma.client.findUnique({ where: { id }, include: { projects: true, leads: true } });
  }

  async update(id: string, data: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({ where: { id }, data });
  }

  async getCount() {
    return this.prisma.client.count();
  }
}
