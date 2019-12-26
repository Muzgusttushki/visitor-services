import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PrepareActivityDTO } from './DTO/PrepareActivityDTO';
import { IUserRequest } from '../../../../services/express/IUserRequest';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';
import { LocaleDate } from '../../../../utils/LocalDate';


@UseGuards(AuthGuard("jwt"))
@Controller('api/dashboard/graphics/activity')
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }
    @Get()
    async activity(@Query() stage: PrepareActivityDTO, @Req() request: IUserRequest) {
        const user = request.user;
        return await this.activityService.GetActivity(new LocaleDate([...stage.pdd, ...stage.sdd]), user);
    }
}
