import { SetMetadata } from "@nestjs/common";
import { RateLimitOptions } from "../interfaces/rate-limit-options.interface";
import { RATE_LIMIT_METADATA } from "../constants/rate-limit.constants";

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_METADATA, options);