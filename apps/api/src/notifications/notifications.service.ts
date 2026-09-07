import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async getUnreadCount(userId?: string) {
    return this.prisma.notification.count({
      where: {
        read: false,
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
    });
  }

  async create(data: {
    title: string;
    message: string;
    type: string;
    userId?: string;
    data?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        data: data.data as Prisma.JsonObject,
      },
    });
  }
}
