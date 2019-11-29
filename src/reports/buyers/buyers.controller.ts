import {Body, Controller, Post, UseGuards, BadRequestException, Req, Get, Param} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BuyersService } from './buyers.service';
import { SourceBrige } from '../../decorators/access/source-brige.decorator';
import { PaymentsUsers } from './dataTransfers/users.dto';
import { PaymentsFiltersDataObject } from './dataTransfers/PaymentsFiltersDataObject';
import { DetailsUserDataObject } from './dataTransfers/DetailsUserDataObject';
import { OperationDetailsDataObject } from '../operations/dataTransfers/operationDetailsDataObject';
import {Request} from 'express'
import {GetStepsUserDTO} from "./DTO/GetStepsUser.DTO";
import {GetStepDetailDTO} from "./DTO/GetStepDetail.DTO";

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) { }
  @Post('payments.get')
  async payments(@Body() filters: PaymentsFiltersDataObject, @SourceBrige() insulation): Promise<PaymentsUsers> {
    return await this.buyersService.payments(filters, insulation).catch(resolve => {
      console.error(resolve);

      throw new BadRequestException();
    });
  }
  @Post('payments.filters')
  async filters(@SourceBrige() insulation): Promise<object> {
    return await this.buyersService.getFilters(insulation).catch(resolve => {
      console.error(resolve);

      throw new BadRequestException();
    });
  }
  @Post('payments.details')
  async details(@Body() stage: OperationDetailsDataObject, @SourceBrige() insulation): Promise<object> {
    return await this.buyersService.transactionDetatils(stage, insulation);
  }
  @Post('getDetailsUserInformation')
  async getDetailsUserInformation(@Body() details: DetailsUserDataObject, @SourceBrige() insulation): Promise<object> {
    return await this.buyersService.detailsPresona(details, insulation);
  }

  @Post('getDetailsUserInformation.steps')
  async detailsUserInformationReadMap(@Body() details: GetStepsUserDTO, @Req() request: Request) {
    const user = request['user'];
    return await this.buyersService.detailsUserInformationRoadMap(details, user.sources)
  }

  @Post('getDetailsUserInformation.info')
  async detailsUserInformation(@Body() details: GetStepDetailDTO) {
    return await this.buyersService.detailsUserInformation(details);
  }

  @Get('buyers/userActivity/:phone')
  async userActivity(@Param('phone') phone: string) {
    return await this.buyersService.userActivity(phone);
  }
}
