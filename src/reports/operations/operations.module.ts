import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';
import {SheetSchema} from "./schemas/SheetSchema";

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
    MongooseModule.forFeature([{ name: 'sheets', schema: SheetSchema }])],
  controllers: [OperationsController],
  providers: [OperationsService]
})
export class OperationsModule {}
