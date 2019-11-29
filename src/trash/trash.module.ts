import { Module } from '@nestjs/common';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';
import {MongooseModule} from "@nestjs/mongoose";
import {OperationSchema} from "../schemas/buyers/OperationSchema";
import {SegmentSchema} from "../segments/segment.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
    MongooseModule.forFeature([{ name: 'segments', schema: SegmentSchema }])],
  controllers: [TrashController],
  providers: [TrashService]
})
export class TrashModule {}
