export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfter: number;
}