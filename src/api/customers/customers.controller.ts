import { Controller, Get, Query, UseGuards, Req, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrepareCustomerFiltersDTO } from './DTO/PrepareCustomerFiltersDTO';
import { AuthGuard } from '@nestjs/passport';
import { IUserRequest } from 'src/services/express/IUserRequest';

@UseGuards(AuthGuard("jwt"))
@Controller('api/customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get('filters')
    async customerFilter(@Query() stage: PrepareCustomerFiltersDTO, @Req() request: IUserRequest) {
        const user = request.user;

        const then = await this.customersService.filters(
            user.access,
            stage.pdd,
            stage.sdd
        );

        return then;
    }
}
