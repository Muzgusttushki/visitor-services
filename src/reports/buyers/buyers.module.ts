import { Module } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';
import {SegmentSchema} from "../../segments/segment.schema";
import {SheetSchema} from "../operations/schemas/SheetSchema";

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
    MongooseModule.forFeature([{ name: 'segments', schema: SegmentSchema }]),
    MongooseModule.forFeature([{ name: 'sheets', schema: SheetSchema }])],
  providers: [BuyersService],
  controllers: [BuyersController],
})
export class BuyersModule { }
