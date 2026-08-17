import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { EncryptionModule } from 'src/core/security/encryption/encryption.module';
import { OtpModule } from '../otp/otp.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        UsersModule,
        EncryptionModule,
        JwtModule.register({}),
        SessionsModule,
        OtpModule,
        NotificationsModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService],
    exports: [TokenService],
})
export class AuthModule { }