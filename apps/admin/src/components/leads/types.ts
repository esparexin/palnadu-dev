export const statusColors: Record<string, string> = {
  NEW: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  CONTACTED: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  DISCOVERY: 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/20',
  PROPOSAL: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  NEGOTIATION: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  WON: 'bg-palnadu-teal/15 text-palnadu-teal border-palnadu-teal/30',
  LOST: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
  NOT_QUALIFIED: 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
  ON_HOLD: 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
};

export const allLeadStatuses = Object.keys(statusColors);
