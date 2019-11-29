import * as mongoose from 'mongoose';

export const OperationSchema = new mongoose.Schema({
  session: String,
  address: String,
  addressInfo: Object,
  analytics: Object,
  brokenTickets: Array<object>(),
  tickets: Array<object>(),
  browser: Object,
  os: Object,
  date: Date,
  source: String,
  status: String,
  event: Object,
  utm: Object,
  buyer: Object,
  url: String,
});
