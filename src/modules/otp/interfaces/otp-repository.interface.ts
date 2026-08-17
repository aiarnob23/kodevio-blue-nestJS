import { OTP } from "generated/prisma/client";
import { OTPType } from "generated/prisma/enums";

export const OTP_REPOSITORY = Symbol('OTP_REPOSITORY');

export interface ICreateOtpInput {
    identifier: string;
    type: OTPType;
    userId?: number;
    codeHash: string;
    expiresAt: Date;
    ipAddress?: string;
    maxAttempts: number;
}

export interface IOtpRepository {
    create(data: ICreateOtpInput): Promise<OTP>;
    findLatestActive(identifier: string, type: OTPType): Promise<OTP | null>;
    incrementAttempts(id: number): Promise<void>;
    markVerified(id: number): Promise<void>;
    invalidateActive(identifier: string, type: OTPType): Promise<void>;
}