import { Document } from 'mongoose';

export interface OperationObject extends Document {
    os(os: any);
  session: string;
  address: string;
  addressInfo: object;
  analytics: object;
  brokenTickets: object[];
  tickets: object[];
  browser: string[];
  date: Date;
  source: string[];
  status: string;
  event: object;
  utm: object;
  buyer: object;
  url: string;
}
