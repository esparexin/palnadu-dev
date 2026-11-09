import { coreServiceContent, type ServiceDetailData } from './service-data-core';
import { advancedServiceContent } from './service-data-advanced';
import { growthServiceContent } from './service-data-growth';

export type { ServiceDetailData };

export const serviceContent: Record<string, ServiceDetailData> = {
  ...coreServiceContent,
  ...advancedServiceContent,
  ...growthServiceContent,
};
