import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
