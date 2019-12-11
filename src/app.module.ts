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


const url = format(
  'mongodb://%s:%s@%s/db1?replicaSet=%s&authSource=%s&ssl=true',
  'vis',
  '6dr0x0u4ijBT&o^#saY@W5Bm',
  [
    'rc1c-fainpcouiaifsp97.mdb.yandexcloud.net:27018'
  ].join(','),
  'rs01',
  'db1'
);

console.log(url);

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
    DashboardModule, OperationsModule, SegmentsModule, TrashModule, RegionsModule],
})
export class AppModule { }
