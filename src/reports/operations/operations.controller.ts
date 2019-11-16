import { Controller, UseGuards, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SourceBrige } from '../../decorators/access/source-brige.decorator';
import { OperationsService } from './operations.service';
import { AcceptFiltersDataObject } from './dataTransfers/AcceptFiltersDataObject';
import { OperationDetailsDataObject } from './dataTransfers/operationDetailsDataObject';

@UseGuards(AuthGuard('jwt'))
@Controller('operations')
export class OperationsController {
    constructor(private readonly operationService: OperationsService) { }
    @Post('get')
    async payments(@Body() filters: AcceptFiltersDataObject, @SourceBrige() insulation): Promise<object> {
        return await this.operationService.operations(filters, insulation).catch(() => {
            throw new BadRequestException()
        })
    }

    @Post('filters')
    async filters(@SourceBrige() insulation): Promise<object> {
        return await this.operationService.filters(insulation).catch(resolve => {
            console.error(resolve);

            throw new BadRequestException();
        });
    }

    @Post('details')
    async details(@Body() stage: OperationDetailsDataObject, @SourceBrige() insulation): Promise<object> {
        return await this.operationService.operationDetails(stage, insulation).catch(resolve => {
            console.error(resolve)

            throw new BadRequestException()
        })
    }
}
