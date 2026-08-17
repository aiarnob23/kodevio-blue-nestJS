import { Inject, Injectable } from "@nestjs/common";
import { SESSION_REPOSITORY, type ISessionRepository } from "./interfaces/session-repository.interface";
import { EncryptionService } from "src/core/security/encryption/encryption.service";
import { NotFoundException } from "src/core/exceptions/not-found.exceptions";
import { ErrorCodes } from "src/core/exceptions/error-codes";
@Injectable()
export class SessionService {
    private readonly SALT_ROUNDS = 8;
    constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: ISessionRepository,
        private readonly EncryptionService: EncryptionService,
    ) { }

    // Create a new session
    async createSession(
        userId: number,
        refreshToken: string,
        meta?: { userAgent?: string, ipAddress?: string, expiresAt?: Date},
    ) {
        const refreshTokenHash = await this.EncryptionService.hash(refreshToken);
        return this.sessionRepository.createSession({
            userId,
            refreshTokenHash,
            lastLoginAt: new Date(),
            ...meta,
        });
    }

    //find valid session
    async findValidSession(userId: number, refreshToken: string) {
        const sessions = await this.sessionRepository.findValidSession(userId);
        for (const session of sessions) {
            const isMatch = await this.EncryptionService.verify(session.refreshTokenHash, refreshToken);
            if (isMatch) return session;
        }
        return null;
    }

    //rotate refresh token
    async rotateRefreshToken(sessionId: number, refreshToken: string) {
        const refreshTokenHash = await this.EncryptionService.hash(refreshToken);
        return this.sessionRepository.rotateRefreshToken(sessionId, refreshTokenHash);
    }

    //revoke session
    async revokeSession(sessionId: number) {
        return this.sessionRepository.revokeSession(sessionId);
    }

    //list all sessions of a user
    async listActiveSessions(userId: number) {
        const sessions = await this.sessionRepository.findValidSession(userId);
        return sessions.map((s) => ({
            id: s.id,
            userAgent: s.userAgent,
            ipAddress: s.ipAddress,
            lastLoginAt: s.lastLoginAt,
            createdAt: s.createdAt,
        }));
    }

    //user can revoke his/her own session
    async revokeOwnSession(userId: number, sessionId: number) {
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || session.userId !== userId || session.isRevoked) {
            throw new NotFoundException(ErrorCodes.SESSION_NOT_FOUND, 'Session not found');
        }
        await this.sessionRepository.revokeSession(sessionId);
    }

    //delete all sessions of a user except current session
    async revokeAllSessions(userId: number, exceptSessionId?: number) {
        return this.sessionRepository.revokeAllByUserId(userId, exceptSessionId);
    }

    //delete revoked and expired sessions
    async deleteExpiredAndRevokedSessions() {
        return this.sessionRepository.deleteExpiredAndRevokedSessions();
    }
}