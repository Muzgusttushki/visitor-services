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
const url = format(
  'mongodb://%s:%s@%s/db1?replicaSet=%s&authSource=%s&ssl=true',
  'collector',
  '180477QwE',
  [
    'rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018'
  ].join(','),
  'rs01',
  'db1'
);

const DEBUG_MODE = false;

const options = {
  useNewUrlParser: true,
  replicaSet: {
    sslCA: readFileSync('/usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt')
  },
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
} as MongooseModuleOptions;

const MONGO_URL =
  'mongodb://localhost:27017/db1';
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true
};

@Module({
  imports: [MongooseModule.forRoot(DEBUG_MODE ? MONGO_URL : url ,
      DEBUG_MODE ? MONGO_OPTIONS : options),
    SignUpModule,
    ManagementModule,
    BuyersModule,
    DashboardModule, OperationsModule, SegmentsModule, TrashModule],
})
export class AppModule { }
