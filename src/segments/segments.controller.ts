import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { AuthGuard } from '@nestjs/passport';
import { ObjectId } from 'bson';
import { SegmentCreate, SegmentDetails, SegmentDetailUsers } from './segment.schema';
import { SegmentExecuteDTO } from "./DTO/SegmentExecuteDTO";
import { IUserRequest } from 'src/services/express/IUserRequest';

@UseGuards(AuthGuard('jwt'))
@Controller('segments')
export class SegmentsController {
    constructor(private readonly segmentService: SegmentsService) { }
    @Post('configure')
    async configure(@Body() info: SegmentExecuteDTO, @Req() request: IUserRequest) {
        const user = request.user;
        return await this.segmentService.configure(info, user);
    }
    @Get('list')
    async list(@Req() request: IUserRequest): Promise<object> {
        const user = request.user
        const segments = await this.segmentService.list(new ObjectId(user._id))

        return {
            error: null,
            then: {
                segments,
                length: segments.length
            }
        }
    }
    @Post('create')
    async create(@Body() segment: SegmentCreate, @Req() request: IUserRequest): Promise<object> {
        const user = request.user
        return await this.segmentService.create(segment, user)
    }
    @Post('get')
    async get(@Body() details: SegmentDetails, @Req() request: IUserRequest): Promise<object> {
        const user = request.user
        return await this.segmentService.get(details.segment, new ObjectId(user['_id']))
    }
    @Post('get.users')
    async getUsers(@Body() details: SegmentDetailUsers, @Req() request: IUserRequest): Promise<object> {
        const user = request.user

        return await this.segmentService.users(details, new ObjectId(user['_id']))
    }
}
