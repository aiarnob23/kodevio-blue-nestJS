import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import type { JwtPayload } from 'src/modules/auth/token.service';

@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionService: SessionService) { }

    // list of all sessions of a user
    @Get()
    @HttpCode(HttpStatus.OK)
    async listSessions(@CurrentUser() user: JwtPayload) {
        const sessions = await this.sessionService.listActiveSessions(user.userId);
        return { message: 'Sessions fetched successfully', data: sessions };
    }

    // user can revoke his/her own session
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async revokeSession(
        @CurrentUser() user: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
    ) {
        await this.sessionService.revokeOwnSession(user.userId, id);
        return { message: 'Session revoked successfully', data: {} };
    }

    // delete all sessions of a user
    @Post('revoke-all')
    @HttpCode(HttpStatus.OK)
    async revokeAll(@CurrentUser() user: JwtPayload) {
        await this.sessionService.revokeAllSessions(user.userId);
        return { message: 'Logged out from all devices', data: {} };
    }
}