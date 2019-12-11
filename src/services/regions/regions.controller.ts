import { Controller, Get, Param } from '@nestjs/common';

@Controller('regions')
export class RegionsController {
    @Get('details/:city')
    async details(@Param('city') city: string) {

    }
}
