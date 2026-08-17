export interface RateLimitOptions {
    bucket: string;
    capacity: number;
    refillRate: number;
    keyby: 'ip' | 'user';
    prefix?: string;
}