import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BuyersService } from './buyers.service';
import { SourceBrige } from '../../decorators/access/source-brige.decorator';
import { PaymentsUsers } from './dataTransfers/users.dto';
import { PaymentsFiltersDataObject } from './dataTransfers/PaymentsFiltersDataObject';
import { DetailsUserDataObject } from './dataTransfers/DetailsUserDataObject';
import { OperationDetailsDataObject } from '../operations/dataTransfers/operationDetailsDataObject';

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
}
