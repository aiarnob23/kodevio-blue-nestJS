import { Inject, Injectable } from "@nestjs/common";
import { AppLogger } from "src/core/logging/logger.service";
import { REDIS_CLIENT } from "src/infrastructure/redis/redis.constant";
import { UsersService } from "../users/users.service";
import { EncryptionService } from "src/core/security/encryption/encryption.service";
import { TokenService } from "./token.service";
import { OtpService } from "../otp/otp.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterDto } from "./dto/register.dto";
import { AuthTokenResult, LogoutResponse, RegisterResponse, SimpleMessageResponse } from "./types/auth.interfaces";
import { ConflictException } from "src/core/exceptions/conflict.exceptions";
import { ErrorCodes } from "src/core/exceptions/error-codes";
import { RequestContext } from "src/core/context/request/request-context";
import { OTPType, UserStatus } from "generated/prisma/enums";
import { emailVerificationTemplate, passwordResetTemplate } from "../email/templates/email-templates";
import { LoginDto } from "./dto/login.dto";
import { UnauthorizedException } from "src/core/exceptions/unauthorized.exceptions";
import { config } from "src/core/config";
import { SessionService } from "../sessions/sessions.service";
import Redis from "ioredis";
import { TOKEN_BLACKLIST_PREFIX } from "./auth.constants";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
        private readonly logger: AppLogger,
        private readonly usersService: UsersService,
        private readonly encryptionService: EncryptionService,
        private readonly tokenService: TokenService,
        private readonly otpService: OtpService,
        private readonly notificationsService: NotificationsService,
        private readonly sessionService: SessionService,
    ){}

    //Register
      async register(dto: RegisterDto): Promise<RegisterResponse> {
        const normalizedEmail = dto.email.trim().toLowerCase();

        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            this.logger.info('Registration attempt failed: email already exists', { email: normalizedEmail });
            throw new ConflictException(ErrorCodes.EMAIL_ALREADY_EXISTS, 'This email is already registered');
        }

        const hashedPassword = await this.hashPassword(dto.password);

        const user = await this.usersService.createUser({
            email: normalizedEmail,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName ? dto.lastName.trim() : undefined,
            passwordHash: hashedPassword,
            phone: dto.phone,
            emailVerifiedAt: null,
        });

        this.logger.info('User created successfully', { userId: user.id });

        await this.dispatchEmailVerificationOtp(user.id, user.email);

        return {
            message: 'User created successfully',
            data: {
                userId: user.id,
                requiredVerification: true,
            },
        };
    }

    //Login
      async login(dto: LoginDto): Promise<AuthTokenResult> {
        const normalizedEmail = dto.email.trim().toLowerCase();
        this.logger.info('Login attempt', { email: normalizedEmail });

        const existingUser = await this.usersService.findByEmail(normalizedEmail);

        // account enumeration prevent
        if (!existingUser || existingUser.deletedAt) {
            this.logger.info('Login failed: user not found or deleted', { email: normalizedEmail });
            throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS, 'Invalid Email or Password');
        }

        const isValidPassword = await this.verifyPassword(dto.password, existingUser.passwordHash);
        if (!isValidPassword) {
            this.logger.info('Login failed: invalid password', { userId: existingUser.id });
            throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS, 'Invalid Email or Password');
        }

        if (existingUser.status !== UserStatus.ACTIVE) {
            this.logger.info('Login failed: account not active', { userId: existingUser.id, status: existingUser.status });
            throw new UnauthorizedException(ErrorCodes.ACCOUNT_NOT_ACTIVE, `Your account is ${existingUser.status}. Please contact support.`);
        }

        if (config.security.requireEmailVerification && !existingUser.isEmailVerified) {
            this.logger.info('Login failed: email not verified', { userId: existingUser.id });
            throw new UnauthorizedException(ErrorCodes.EMAIL_NOT_VERIFIED, 'Please verify your email before logging in');
        }

        const { accessToken, refreshToken } = this.tokenService.generateToken(existingUser.id, existingUser.email);

        const ctx = RequestContext.get();
        const refreshExpiresInSeconds = Number(config.security.jwt.refreshExpiresIn);
        await this.sessionService.createSession(existingUser.id, refreshToken, {
            ipAddress: ctx?.ipAddress,
            userAgent: ctx?.userAgent,
            expiresAt: new Date(Date.now() + refreshExpiresInSeconds * 1000),
        });

        this.logger.info('User logged in successfully', { userId: existingUser.id });

        return {
            message: 'User logged in successfully',
            data: { userId: existingUser.id, accessToken, refreshToken },
        };
    }

    //Refresh
    async refresh(refreshTokenFromCookie: string): Promise<AuthTokenResult> {
        const payload = this.tokenService.verifyRefreshToken(refreshTokenFromCookie);

        const user = await this.usersService.findByEmail(payload.email);
        if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
            this.logger.info('Token refresh failed: user not found, deleted or inactive', { email: payload.email });
            throw new UnauthorizedException(ErrorCodes.INVALID_TOKEN, 'Refresh token is invalid or expired');
        }

        const session = await this.sessionService.findValidSession(payload.userId, refreshTokenFromCookie);
        if (!session) {
            this.logger.info('Token refresh failed: valid session not found', { userId: payload.userId });
            throw new UnauthorizedException(ErrorCodes.INVALID_TOKEN, 'Refresh token is invalid or expired');
        }

        const { accessToken, refreshToken } = this.tokenService.generateToken(payload.userId, payload.email);
        await this.sessionService.rotateRefreshToken(session.id, refreshToken);
        this.logger.info('Token refreshed successfully', { userId: user.id });

        return {
            message: 'Token refreshed successfully',
            data: { userId: user.id, accessToken, refreshToken },
        };
    }

    //Logout
    async logout(refreshToken: string, accessToken: string): Promise<LogoutResponse> {
        if (refreshToken) {
            try {
                const payload = this.tokenService.verifyRefreshToken(refreshToken);
                this.logger.info('Logout attempt', { userId: payload.userId });
                if (payload?.userId) {
                    const session = await this.sessionService.findValidSession(payload.userId, refreshToken);
                    if (session) {
                        await this.sessionService.revokeSession(session.id);
                        this.logger.info('Session revoked successfully', { userId: payload.userId, sessionId: session.id });
                    }
                }
            } catch (error) {
                this.logger.info('Session revocation skipped during logout: refresh token invalid or expired', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        if (accessToken) {
            try {
                const accessExpiresInSeconds = Number(config.security.jwt.acessExpiresIn) || 900;
                await this.redis.setex(`${TOKEN_BLACKLIST_PREFIX}${accessToken}`, accessExpiresInSeconds, '1');
                this.logger.info('Access token blacklisted successfully');
            } catch (error) {
                this.logger.logError('Error blacklisting access token during logout', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return { message: 'Logout successfully' };
    }

    //Verify Email
    async verifyEmail(dto: VerifyEmailDto): Promise<SimpleMessageResponse> {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);
        if (!user || user.deletedAt) {
            throw new UnauthorizedException(ErrorCodes.OTP_INVALID, 'Invalid or expired verification code');
        }
        if (user.isEmailVerified) {
            throw new ConflictException(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email is already verified');
        }

        await this.otpService.verify(normalizedEmail, OTPType.EMAIL_VERIFICATION, dto.code);
        await this.usersService.markEmailVerified(user.id);

        this.logger.info('Email verified successfully', { userId: user.id });
        return { message: 'Email verified successfully' };
    }

    //Resend Verification
    async resendVerification(dto: ResendVerificationDto): Promise<SimpleMessageResponse> {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);

        if (user && !user.deletedAt && !user.isEmailVerified) {
            await this.dispatchEmailVerificationOtp(user.id, user.email);
        }

        return { message: 'If an unverified account exists for this email, a verification code has been sent.' };
    }

    //Forgot Password
    async forgotPassword(dto: ForgotPasswordDto): Promise<SimpleMessageResponse> {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);

        if (user && !user.deletedAt && user.status === UserStatus.ACTIVE) {
            const ctx = RequestContext.get();
            const code = await this.otpService.generate(normalizedEmail, OTPType.PASSWORD_RESET, user.id, ctx?.ipAddress);
            const { subject, html, text } = passwordResetTemplate(code);
            await this.notificationsService.sendEmail({ to: user.email, subject, html, text });
        }
        return { message: 'If an account exists for this email, password reset instructions have been sent.' };
    }

    //Reset Password
    async resetPassword(dto: ResetPasswordDto): Promise<SimpleMessageResponse> {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);
        if (!user || user.deletedAt) {
            throw new UnauthorizedException(ErrorCodes.OTP_INVALID, 'Invalid or expired verification code');
        }

        await this.otpService.verify(normalizedEmail, OTPType.PASSWORD_RESET, dto.code);

        const newPasswordHash = await this.hashPassword(dto.newPassword);
        await this.usersService.updatePassword(user.id, newPasswordHash);

        await this.sessionService.revokeAllSessions(user.id);

        this.logger.info('Password reset successfully', { userId: user.id });
        return { message: 'Password reset successfully. Please log in again on all your devices.' };
    }

     private async hashPassword(password: string): Promise<string> {
        return await this.encryptionService.hash(password);
    }

    private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await this.encryptionService.verify(hashedPassword, plainPassword);
    }

    private async dispatchEmailVerificationOtp(userId: number, email: string): Promise<void> {
        const ctx = RequestContext.get();
        const code = await this.otpService.generate(email, OTPType.EMAIL_VERIFICATION, userId, ctx?.ipAddress);
        const { subject, html, text } = emailVerificationTemplate(code);
        await this.notificationsService.sendEmail({ to: email, subject, html, text });
    }
}