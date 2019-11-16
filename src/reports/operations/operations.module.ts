import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }])],
  controllers: [OperationsController],
  providers: [OperationsService]
})
export class OperationsModule {}
