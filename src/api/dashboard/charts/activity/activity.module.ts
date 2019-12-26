import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionModel } from '../../../../database/Models/ActionModel';
import { PaymentModel } from '../../../../database/Models/PaymentModel';

@Module({
  providers: [ActivityService],
  controllers: [ActivityController],
  imports: [
    MongooseModule.forFeature([
      { name: 'buyers', schema: ActionModel }
    ]),
    MongooseModule.forFeature([
      { name: 't_payments', schema: PaymentModel }
    ])
  ]
})
export class ActivityModule { }
