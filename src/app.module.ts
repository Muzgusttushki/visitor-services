import { Module } from '@nestjs/common';
import { SignUpModule } from './account/signup/signup.module';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ManagementModule } from './account/management/management.module';
import { BuyersModule } from './reports/buyers/buyers.module';
import { DashboardModule } from './reports/dashboard/dashboard.module';
import { OperationsModule } from './reports/operations/operations.module';
import { readFileSync } from 'fs';
import { format } from 'util';
import { SegmentsModule } from './segments/segments.module';
import { TrashModule } from './trash/trash.module';
import { RegionsModule } from './services/regions/regions.module';
import { CustomersModule } from './api/customers/customers.module';
import { ActivityModule } from './api/dashboard/charts/activity/activity.module';


const url = format(
  'mongodb://%s:%s@%s/vst?replicaSet=%s&authSource=%s&ssl=true',
  'vst',
  '3yGCxwcR8v6fEL5rWjaqh8veukKFCg47hzHP',
  [
    // 'rc1a-ubiyvdri57npqa0y.mdb.yandexcloud.net:27018',
    'rc1c-qkouniz9jsicq8d1.mdb.yandexcloud.net:27018'
  ].join(','),
  'rs01',
  'vst'
);

const options = {
  useNewUrlParser: true,
  replicaSet: {
    sslCA: readFileSync('/usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt')
  },
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

@Module({
  imports: [MongooseModule.forRoot(url, options),
    SignUpModule,
    ManagementModule,
    BuyersModule,
    DashboardModule, OperationsModule, SegmentsModule, TrashModule, RegionsModule, CustomersModule, ActivityModule],
})
export class AppModule { }
