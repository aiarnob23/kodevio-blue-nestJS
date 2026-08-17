import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { config } from 'src/core/config';
import { UnauthorizedException } from 'src/core/exceptions/unauthorized.exceptions';
import { ErrorCodes } from 'src/core/exceptions/error-codes';
import { Public } from 'src/core/decorators/public.decorator';
import { RateLimit } from 'src/core/rate-limit/decorators/rate-limit.decorator';
import {
    LOGIN_BUCKET,
    RESET_PASSWORD_BUCKET,
    VERIFY_EMAIL_BUCKET,
    RESEND_VERIFICATION_BUCKET,
    REFRESH_TOKEN_BUCKET,
} from 'src/core/rate-limit/constants/buckets';
import { AuthTokenResponse } from './types/auth-token-response.type';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: Number(config.security.jwt.refreshExpiresIn) * 1000,
    path: '/',
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto) {
        const result = await this.authService.register(dto);
        return {
            message: 'User created successfully',
            data: {
                userId: result.data.userId,
                requiredVerification: result.data.requiredVerification,
            }
        }
    }

    @Public()
    @RateLimit(LOGIN_BUCKET)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto);
        this.setRefreshCookie(res, result.data.refreshToken);
        return this.buildTokenResponse(result);
    }

    @Public()
    @RateLimit(REFRESH_TOKEN_BUCKET)
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.['refreshToken'];
        if (!refreshToken) {
            throw new UnauthorizedException(ErrorCodes.INVALID_TOKEN, 'Refresh token is invalid or expired')
        }
        const result = await this.authService.refresh(refreshToken);
        this.setRefreshCookie(res, result.data.refreshToken);
        return this.buildTokenResponse(result);
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.['refreshToken'];
        const accessToken = req.headers['authorization']?.split(' ')[1];
        if (refreshToken || accessToken) {
            await this.authService.logout(refreshToken ?? '', accessToken ?? '');
        }
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
        return { message: 'Logout successfully', data: {} }
    }

    @Public()
    @RateLimit(VERIFY_EMAIL_BUCKET)
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        const result = await this.authService.verifyEmail(dto);
        return { message: result.message, data: {} };
    }

    @Public()
    @RateLimit(RESEND_VERIFICATION_BUCKET)
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Body() dto: ResendVerificationDto) {
        const result = await this.authService.resendVerification(dto);
        return { message: result.message, data: {} };
    }

    @Public()
    @RateLimit(RESET_PASSWORD_BUCKET)
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(dto);
        return { message: result.message, data: {} };
    }

    @Public()
    @RateLimit(RESET_PASSWORD_BUCKET)
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const result = await this.authService.resetPassword(dto);
        return { message: result.message, data: {} };
    }

    private setRefreshCookie(res: Response, refreshToken: string): void {
        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    }

    private buildTokenResponse(result: AuthTokenResponse) {
        return {
            message: result.message,
            data: {
                userId: result.data.userId,
                accessToken: result.data.accessToken,
            }
        }
    }
}