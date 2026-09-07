import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LeadCreateInput) {
    // Save lead
    const lead = await this.prisma.lead.create({ data });

    // Also save as contact submission for audit
    await this.prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone as string | undefined,
        company: data.company as string | undefined,
        problemDescription: data.problemDescription,
        currentSituation: data.currentSituation as string | undefined,
        projectStage: data.projectStage,
        requiredHelp: data.requiredHelp,
        budget: data.budget as string | undefined,
        additionalInfo: data.additionalInfo as string | undefined,
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        title: 'New Lead',
        message: `New inquiry from ${data.name} (${data.email})`,
        type: 'NEW_LEAD',
        data: { leadId: lead.id } as Prisma.JsonObject,
      },
    });

    // TODO: Send email notification via Resend

    return lead;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        convertedClient: true,
      },
    });
  }

  async update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data,
    });
  }

  async getNewLeadsCount() {
    return this.prisma.lead.count({
      where: { status: LeadStatus.NEW },
    });
  }
}
