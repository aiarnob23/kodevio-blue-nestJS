import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { OTPType } from 'generated/prisma/client';
import { config } from 'src/core/config';
import { EncryptionService } from 'src/core/security/encryption/encryption.service';
import { ErrorCodes } from 'src/core/exceptions/error-codes';
import { UnauthorizedException } from 'src/core/exceptions/unauthorized.exceptions';
import {
  OTP_REPOSITORY,
  type IOtpRepository,
} from './interfaces/otp-repository.interface';

@Injectable()
export class OtpService {
  constructor(
    @Inject(OTP_REPOSITORY) private readonly otpRepository: IOtpRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async generate(
    identifier: string,
    type: OTPType,
    userId?: number,
    ipAddress?: string,
  ): Promise<string> {
    const code = this.generateNumericCode(config.otp.length);
    const codeHash = await this.encryptionService.hash(code);
    const expiresAt = new Date(
      Date.now() + config.otp.expiryMinutes * 60 * 1000,
    );

    await this.otpRepository.invalidateActive(identifier, type);
    await this.otpRepository.create({
      identifier,
      type,
      userId,
      codeHash,
      expiresAt,
      ipAddress,
      maxAttempts: config.otp.maxAttempts,
    });

    return code;
  }

  async verify(identifier: string, type: OTPType, code: string): Promise<void> {
    const otp = await this.otpRepository.findLatestActive(identifier, type);
    if (!otp) {
      throw new UnauthorizedException(
        ErrorCodes.OTP_INVALID,
        'Invalid or expired verification code',
      );
    }
    if (otp.attempts >= otp.maxAttempts) {
      throw new UnauthorizedException(
        ErrorCodes.OTP_MAX_ATTEMPTS_EXCEEDED,
        'Too many attempts, please request a new code',
      );
    }

    const isMatch = await this.encryptionService.verify(otp.codeHash, code);
    if (!isMatch) {
      await this.otpRepository.incrementAttempts(otp.id);
      throw new UnauthorizedException(
        ErrorCodes.OTP_INVALID,
        'Invalid or expired verification code',
      );
    }

    await this.otpRepository.markVerified(otp.id);
  }

  private generateNumericCode(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return randomInt(min, max + 1).toString();
  }
}
