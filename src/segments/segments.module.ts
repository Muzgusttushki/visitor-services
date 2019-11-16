import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { OperationSchema } from '../schemas/buyers/OperationSchema';
import { MongooseModule } from '@nestjs/mongoose';
import { SegmentSchema } from './segment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
  MongooseModule.forFeature([{ name: 'segments', schema: SegmentSchema }])],
  controllers: [SegmentsController],
  providers: [SegmentsService]
})
export class SegmentsModule {}
