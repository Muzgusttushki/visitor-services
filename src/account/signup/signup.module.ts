import { HttpModule, Module } from '@nestjs/common';
import { SignUpService } from './signup.service';
import { SignUpController } from './signup.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from '../../schemas/account/AccountSchema';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from '../security/strategy';
import { ManagementService } from '../management/management.service';
import { OperationSchema } from '../../schemas/buyers/OperationSchema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'users', schema: AccountSchema }]),
    MongooseModule.forFeature([{ name: 'buyers', schema: OperationSchema }]),
    JwtModule.register({
      secret: 'bnPdjBB@@2vg3yYfcmQP@cXtnhX6m0TQ*wx683!GvzKKeRq3',
      signOptions: { expiresIn: '72h' },
    }),
    HttpModule,
  ],
  providers: [SignUpService, ManagementService, LocalStrategy],
  controllers: [SignUpController],
})
export class SignUpModule {}
