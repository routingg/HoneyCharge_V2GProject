export interface GuaranteedSocResult {
  guaranteedSoc: number;
  tripRequirementSoc: number;
  userReserveSoc: number;
  uncertaintyMarginSoc: number;
  hardMinimumSoc: number;
  confidence: number;
  reasoning: string[];
}
