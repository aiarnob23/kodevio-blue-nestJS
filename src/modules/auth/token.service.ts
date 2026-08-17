import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { config } from 'src/core/config';
import { ErrorCodes } from 'src/core/exceptions/error-codes';
import { UnauthorizedException } from 'src/core/exceptions/unauthorized.exceptions';

export interface JwtPayload {
    userId: number;
    email: string;
    type: 'access' | 'refresh';
}

export interface TokenPayload {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
    ) {}

    generateToken(
        userId: number,
        email: string,
    ): TokenPayload {
        const accessToken = this.jwtService.sign(
            {
                userId,
                email,
                type: 'access',
            },
            {
                secret: config.security.jwt.secret,
                expiresIn: config.security.jwt.acessExpiresIn as any,
                issuer: config.security.jwt.issuer,
            },
        );

        const refreshToken = this.jwtService.sign(
            {
                userId,
                email,
                type: 'refresh',
            },
            {
                secret: config.security.jwt.secret,
                expiresIn: config.security.jwt.refreshExpiresIn as any,
                issuer: config.security.jwt.issuer,
            },
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    verifyAccessToken(token: string): JwtPayload {
        const payload = this.verify(
            token,
            ErrorCodes.INVALID_TOKEN,
            'Access token is invalid or expired',
        );

        if (payload.type !== 'access') {
            throw new UnauthorizedException(
                ErrorCodes.INVALID_TOKEN,
                'Access token is invalid or expired',
            );
        }

        return payload;
    }

    verifyRefreshToken(token: string): JwtPayload {
        const payload = this.verify(
            token,
            ErrorCodes.INVALID_TOKEN,
            'Refresh token is invalid or expired',
        );

        if (payload.type !== 'refresh') {
            throw new UnauthorizedException(
                ErrorCodes.INVALID_TOKEN,
                'Refresh token is invalid or expired',
            );
        }

        return payload;
    }

    private verify(
        token: string,
        code = ErrorCodes.INVALID_TOKEN,
        message = 'Token is invalid or expired',
    ): JwtPayload {
        try {
            return this.jwtService.verify<JwtPayload>(
                token,
                {
                    secret: config.security.jwt.secret,
                    issuer: config.security.jwt.issuer,
                },
            );
        } catch {
            throw new UnauthorizedException(
                code,
                message,
            );
        }
    }
}