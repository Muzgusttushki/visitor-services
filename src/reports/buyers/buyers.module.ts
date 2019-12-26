import { Module } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';
import { SegmentSchema } from "../../segments/segment.schema";
import { SheetSchema } from "../operations/schemas/SheetSchema";
import { ClientsModule, Transport } from "@nestjs/microservices"

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
  MongooseModule.forFeature([{ name: 'segments', schema: SegmentSchema }]),
  MongooseModule.forFeature([{ name: 'sheets', schema: SheetSchema }]),
  ClientsModule.register([
    { name: 'Services->Matrix', transport: Transport.TCP },
  ])],
  providers: [BuyersService],
  controllers: [BuyersController],
})
export class BuyersModule { }
