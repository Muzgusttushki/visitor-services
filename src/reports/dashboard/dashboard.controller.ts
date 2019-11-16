import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardObject } from '../../transferDataObject/dashboard/dashboardObject';
import { AccountObject } from '../../transferDataObject/account/AccountObject';
import { DashboardService } from './dashboard.service';
import { SourceBrige } from '../../decorators/access/source-brige.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }
  @Post()
  async getDashboard(@Body() stage: DashboardObject,
    @Request() req: Request): Promise<object> {

    const session = req['user'] as AccountObject;
    return await this.dashboardService.getDashboardStats(stage, session);
  }

  @Post('graphics/sales')
  async graphicsSales(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsSales(stage,
      insulation)
  }

  @Post('graphics/devices')
  async graphicsDevices(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsDevices(stage,
      insulation)
  }

  @Post('graphics/eventsTop')
  async graphicsEventsTop(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsSalesRanking(stage,
      insulation);
  }

  @Post('graphics/locations')
  async graphicsBuyersLocation(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsLocation(stage,
      insulation);
  }

  @Post('graphics/buyersNewOld')
  async graphicsBuyersNewOld(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsNewBuyers(stage,
      insulation);
  }

  @Post('graphics/tickets')
  async graphicsSalesTicket(@Body() stage: DashboardObject, @SourceBrige() insulation): Promise<object> {
    return await this.dashboardService.graphicsSalesTicket(stage,
      insulation);
  }
}
