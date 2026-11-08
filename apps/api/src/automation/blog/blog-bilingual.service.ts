import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { readBilingualConfig, BilingualConfig } from '../bilingual-quota';

@Injectable()
export class BlogBilingualService {
  constructor(private readonly prisma: PrismaService) {}

  async readBilingualSwitch(): Promise<BilingualConfig> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: ['bilingual_generation_enabled', 'bilingual_quota_te', 'bilingual_quota_en'] } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    return readBilingualConfig((key) => byKey.get(key));
  }

  async getBilingualStatus(): Promise<BilingualConfig & { pending: { te: number; en: number } }> {
    const config = await this.readBilingualSwitch();
    const [te, en] = await Promise.all([
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING, language: BlogLanguage.te } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING, language: BlogLanguage.en } }),
    ]);
    return { ...config, pending: { te, en } };
  }

  async setBilingualConfig(input: { enabled?: boolean; te?: number; en?: number }): Promise<BilingualConfig> {
    if (input.enabled !== undefined) {
      await this.prisma.siteSetting.upsert({
        where: { key: 'bilingual_generation_enabled' },
        update: { value: Boolean(input.enabled) },
        create: {
          key: 'bilingual_generation_enabled',
          value: Boolean(input.enabled),
          description: 'Bilingual generation switch',
        },
      });
    }
    if (input.te !== undefined) {
      await this.prisma.siteSetting.upsert({
        where: { key: 'bilingual_quota_te' },
        update: { value: Math.max(0, Math.floor(input.te)) },
        create: { key: 'bilingual_quota_te', value: Math.max(0, Math.floor(input.te)), description: 'Telugu quota' },
      });
    }
    if (input.en !== undefined) {
      await this.prisma.siteSetting.upsert({
        where: { key: 'bilingual_quota_en' },
        update: { value: Math.max(0, Math.floor(input.en)) },
        create: { key: 'bilingual_quota_en', value: Math.max(0, Math.floor(input.en)), description: 'English quota' },
      });
    }
    return this.readBilingualSwitch();
  }
}
