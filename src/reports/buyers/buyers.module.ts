import { Module } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { BuyersController } from './buyers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }])],
  providers: [BuyersService],
  controllers: [BuyersController],
})
export class BuyersModule { }
