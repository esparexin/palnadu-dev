import { coreServiceContent, type ServiceDetailData } from './service-data-core';
import { advancedServiceContent } from './service-data-advanced';

export type { ServiceDetailData };

export const serviceContent: Record<string, ServiceDetailData> = {
  ...coreServiceContent,
  ...advancedServiceContent,
};
