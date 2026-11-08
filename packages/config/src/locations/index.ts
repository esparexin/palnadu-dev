// ─── Location Data & Profiles (SSOT) ──────────────────────────────
// Genuine economic and commercial data for Palnadu, Guntur & surrounding hubs.
// Avoids doorway/duplicate pages by providing authentic local business context.

import { LocationData } from './types';
import { coastalLocations } from './coastal-locations';
import { regionalHubLocations } from './regional-hubs';

export * from './types';
export * from './revenue-divisions';
export * from './coastal-locations';
export * from './regional-hubs';

export const coreLocations: LocationData[] = [
  ...coastalLocations,
  ...regionalHubLocations,
];
