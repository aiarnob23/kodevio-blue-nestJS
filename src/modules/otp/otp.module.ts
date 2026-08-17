import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/database/prisma/prisma.module';
import { EncryptionModule } from 'src/core/security/encryption/encryption.module';
import { OTP_REPOSITORY } from './interfaces/otp-repository.interface';
import { PrismaOtpRepository } from './repositories/prisma-otp.repository';
import { OtpService } from './otp.service';

@Module({
    imports: [PrismaModule, EncryptionModule],
    providers: [
        OtpService,
        { provide: OTP_REPOSITORY, useClass: PrismaOtpRepository },
    ],
    exports: [OtpService],
})
export class OtpModule { }