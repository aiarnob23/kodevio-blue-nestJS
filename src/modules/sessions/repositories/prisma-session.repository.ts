import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { ICreateSessionInput, ISessionRepository } from "../interfaces/session-repository.interface";
import { UserSession } from "generated/prisma/client";

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    createSession(data: ICreateSessionInput): Promise<UserSession> {
        return this.upsertByUserId(data);
    }

    async upsertByUserId(data: ICreateSessionInput): Promise<UserSession> {
        const existingSession = await this.prisma.userSession.findFirst({
            where: {
                userId: data.userId,
                userAgent: data.userAgent,
                isRevoked: false,
            },
        });
        if (existingSession) {
            return this.prisma.userSession.update({
                where: { id: existingSession.id },
                data: {
                    refreshTokenHash: data.refreshTokenHash,
                    lastLoginAt: new Date(),
                    expiresAt: data.expiresAt,
                    isRevoked: false,
                }
            })
        }
        return this.prisma.userSession.create({ data });
    }

    findValidSession(userId: number): Promise<UserSession[]> {
        return this.prisma.userSession.findMany({
            where: { userId, isRevoked: false },
            orderBy: { lastLoginAt: 'desc' },
        });
    }

    findById(sessionId: number): Promise<UserSession | null> {
        return this.prisma.userSession.findUnique({ where: { id: sessionId } });
    }

    async revokeSession(sessionId: number): Promise<void> {
        await this.prisma.userSession.update({
            where: { id: sessionId },
            data: { isRevoked: true },
        });
    }

    async revokeAllByUserId(userId: number, exceptSessionId?: number): Promise<void> {
        await this.prisma.userSession.updateMany({
            where: {
                userId,
                isRevoked: false,
                ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
            },
            data: { isRevoked: true },
        });
    }

    async rotateRefreshToken(sessionId: number, refreshTokenHash: string): Promise<UserSession> {
        return this.prisma.userSession.update({
            where: { id: sessionId },
            data: { refreshTokenHash },
        });
    }

    async deleteExpiredAndRevokedSessions(): Promise<number> {
        const result = await this.prisma.userSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lte: new Date() } },
                    { isRevoked: true },
                ]
            }
        });
        return result.count;
    }
}