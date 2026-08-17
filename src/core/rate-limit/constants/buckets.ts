import { RateLimitOptions } from "../interfaces/rate-limit-options.interface";

export const LOGIN_BUCKET: RateLimitOptions = {
    bucket: 'login',
    capacity: 5,
    refillRate: 1 / 12,
    keyby: 'ip',
};

export const REGISTER_BUCKET: RateLimitOptions = {
    bucket: 'register',
    capacity: 3,
    refillRate: 1 / 1200,
    keyby: 'ip',
};

export const RESET_PASSWORD_BUCKET: RateLimitOptions = {
    bucket: 'reset-password',
    capacity: 3,
    refillRate: 1 / 1200,
    keyby: 'ip',
};

export const REFRESH_TOKEN_BUCKET: RateLimitOptions = {
    bucket: 'refresh-token',
    capacity: 20,
    refillRate: 1 / 3,
    keyby: 'ip',
}

export const VERIFY_EMAIL_BUCKET: RateLimitOptions = {
    bucket: 'verify-email',
    capacity: 5,
    refillRate: 1 / 60,
    keyby: 'ip',
};

export const RESEND_VERIFICATION_BUCKET: RateLimitOptions = {
    bucket: 'resend-verification',
    capacity: 3,
    refillRate: 1 / 600,
    keyby: 'ip',
};