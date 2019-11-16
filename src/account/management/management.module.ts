import { Module } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ManagementController } from './management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from '../../schemas/account/AccountSchema';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'users', schema: AccountSchema }]),
  MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }])],
  providers: [ManagementService],
  controllers: [ManagementController],
})
export class ManagementModule { }
