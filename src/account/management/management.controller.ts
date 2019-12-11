import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IUserRequest } from 'src/services/express/IUserRequest';

@UseGuards(AuthGuard('jwt'))
@Controller('account/management')
export class ManagementController {


    @Get('sources')
    getAvailableSources(@Req() request: IUserRequest): String[] {
        const user = request.user;
        return user.sources || [];
    }
}
