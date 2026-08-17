import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { OTP, OTPType } from 'generated/prisma/client';
import {
  ICreateOtpInput,
  IOtpRepository,
} from '../interfaces/otp-repository.interface';

@Injectable()
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: ICreateOtpInput): Promise<OTP> {
    return this.prisma.oTP.create({ data });
  }

  findLatestActive(identifier: string, type: OTPType): Promise<OTP | null> {
    return this.prisma.oTP.findFirst({
      where: {
        identifier,
        type,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempts(id: number): Promise<void> {
    await this.prisma.oTP.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markVerified(id: number): Promise<void> {
    await this.prisma.oTP.update({
      where: { id },
      data: { verified: true, verifiedAt: new Date() },
    });
  }

  async invalidateActive(identifier: string, type: OTPType): Promise<void> {
    await this.prisma.oTP.updateMany({
      where: {
        identifier,
        type,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });
  }
}
