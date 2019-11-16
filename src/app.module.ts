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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const url = format(
  'mongodb://%s:%s@%s/db1?replicaSet=%s&authSource=%s&ssl=true',
  'collector',
  '180477QwE',
  [
    'rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018'
  ].join(','),
  'rs01',
  'db1'
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const options = {
  useNewUrlParser: true,
  replicaSet: {
    sslCA: readFileSync('/usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt')
  },
  useUnifiedTopology: true,
  useFindAndModify: true,
  useCreateIndex: true,
} as MongooseModuleOptions

const MONGO_URL =
  'mongodb://localhost:27017/db1';
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
  useCreateIndex: true
};

@Module({
  imports: [MongooseModule.forRoot(url, options),
    SignUpModule,
    ManagementModule,
    BuyersModule,
    DashboardModule, OperationsModule, SegmentsModule],
})
export class AppModule { }
