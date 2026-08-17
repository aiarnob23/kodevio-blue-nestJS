import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { type JwtPayload } from '../auth/token.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    //get self profile
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getSelfProfile(
        @CurrentUser() user: JwtPayload
    ) {
        const profile = await this.usersService.getSelfProfileById(user.userId);
        return {
            message: 'Profile fetched successfully',
            data: profile,
        }
    }
}
