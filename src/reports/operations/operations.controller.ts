import { Controller, UseGuards, Post, Body, BadRequestException, Query, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SourceBrige } from '../../decorators/access/source-brige.decorator';
import { OperationsService } from './operations.service';
import { AcceptFiltersDataObject } from './dataTransfers/AcceptFiltersDataObject';
import { OperationDetailsDataObject } from './dataTransfers/operationDetailsDataObject';
import { ActionsFilterDTO } from './DTO/ActionsFilterDTO';

@UseGuards(AuthGuard('jwt'))
@Controller('operations')
export class OperationsController {
    constructor(private readonly operationService: OperationsService) { }

    @Post('get')
    async payments(@Body() filters: ActionsFilterDTO, @SourceBrige() insulation): Promise<object> {
        return await this.operationService.get(filters, insulation).catch((err) => {
            console.error(err);
            throw new BadRequestException()
        })
    }

    @Post('filters')
    async filters(@SourceBrige() insulation): Promise<object> {
        const state = await this.operationService.filters(insulation).catch(() => Object({
            length: 0,
            documents: []
        }));

        return state;
    }

    @Post('details')
    async details(@Body() stage: OperationDetailsDataObject, @SourceBrige() insulation): Promise<object> {
        return await this.operationService.details(stage, insulation).catch(resolve => {
            throw new BadRequestException()
        })
    }

    @Post('details.sheet')
    async detailsSheet(@Body() stage: OperationDetailsDataObject, @SourceBrige() bridge) {
        return await this.operationService.sheetDetails(stage, bridge)
    }
}
