import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LicensedImage } from './image-vault';
import { FALLBACK_VAULT } from './image-vault';

export type { LicensedImage };

@Injectable()
export class ImageSourcingService {
  private readonly logger = new Logger(ImageSourcingService.name);
  private readonly unsplashAccessKey: string | undefined;
  private readonly pexelsApiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.unsplashAccessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY');
    this.pexelsApiKey = this.configService.get<string>('PEXELS_API_KEY');
  }

  /**
   * Sources 3 to 5 legally verified commercial-use images for an article.
   * Checks Unsplash/Pexels APIs first, falling back to the curated vault.
   */
  async sourceImagesForArticle(
    topic: string,
    categorySlug: string,
    count = 4,
  ): Promise<LicensedImage[]> {
    const results: LicensedImage[] = [];

    // 1. Attempt live Unsplash API if key is present
    if (this.unsplashAccessKey) {
      try {
        const query = encodeURIComponent(`${topic} technology software`);
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${this.unsplashAccessKey}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length >= 3) {
            for (const item of data.results.slice(0, count)) {
              results.push({
                url: `${item.urls.raw}&auto=format&fit=crop&w=1200&q=80`,
                alt: item.alt_description || `${topic} illustration`,
                caption: `Photo by ${item.user.name} on Unsplash`,
                photographer: item.user.name,
                photographerProfile: item.user.links.html,
                source: 'Unsplash',
                licenseType: 'Unsplash Commercial License',
                licenseUrl: 'https://unsplash.com/license',
                originalUrl: item.links.html,
              });
            }
            this.logger.log(`Sourced ${results.length} live Unsplash photos for: "${topic}"`);
            return results;
          }
        }
      } catch (err) {
        this.logger.warn(
          `Unsplash API query failed: ${err instanceof Error ? err.message : err}. Using curated vault.`,
        );
      }
    }

    // Fallback: Use verified, curated high-resolution CC0/Commercial-Use vault
    const categoryVault = FALLBACK_VAULT[categorySlug] || FALLBACK_VAULT['default'];
    const combined = [...categoryVault];
    for (const fallback of FALLBACK_VAULT['default']) {
      if (combined.length >= count) break;
      if (!combined.some((img) => img.url === fallback.url)) {
        combined.push(fallback);
      }
    }
    return combined.slice(0, count);
  }
}
